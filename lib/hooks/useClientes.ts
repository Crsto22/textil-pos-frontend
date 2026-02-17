"use client"

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
    SEARCH_DEBOUNCE_MS,
    useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type {
    Cliente,
    ClienteCreateRequest,
    ClienteUpdateRequest,
} from "@/lib/types/cliente"
import type { PageResponse } from "@/lib/types/usuario"

interface SearchTotals {
    totalPages: number
    totalElements: number
}

function getErrorMessage(status: number, backendMsg?: string): string {
    if (backendMsg) return backendMsg
    if (status === 401) return "SesiÃ³n expirada, vuelve a iniciar sesiÃ³n"
    if (status === 403) return "No tienes permisos"
    if (status === 500) return "Error interno del servidor"
    return "Error inesperado"
}

async function parseJsonSafe(response: Response) {
    return response.json().catch(() => null)
}

function isAbortError(error: unknown) {
    return error instanceof DOMException && error.name === "AbortError"
}

export function useClientes() {
    const { isLoading: isAuthLoading } = useAuth()

    const [clientes, setClientes] = useState<Cliente[]>([])
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [search, setSearch] = useState("")
    const [searchPage, setSearchPage] = useState(0)
    const resetSearchPage = useCallback(() => {
        setSearchPage(0)
    }, [])
    const debouncedSearch = useDebouncedValue(
        search,
        SEARCH_DEBOUNCE_MS,
        resetSearchPage
    )
    const [searchResults, setSearchResults] = useState<Cliente[]>([])
    const [searchTotals, setSearchTotals] = useState<SearchTotals>({
        totalPages: 0,
        totalElements: 0,
    })
    const [searching, setSearching] = useState(false)

    const listAbortRef = useRef<AbortController | null>(null)
    const searchAbortRef = useRef<AbortController | null>(null)

    const isSearchMode = debouncedSearch.trim().length > 0

    const fetchClientes = useCallback(async (pageNumber: number) => {
        listAbortRef.current?.abort()
        const controller = new AbortController()
        listAbortRef.current = controller

        setLoading(true)
        setError(null)

        try {
            const response = await authFetch(`/api/cliente/listar?page=${pageNumber}`, {
                signal: controller.signal,
            })
            const data = await parseJsonSafe(response)
            if (controller.signal.aborted) return

            if (!response.ok) {
                const message = getErrorMessage(response.status, data?.message)
                setError(message)
                toast.error(message)
                return
            }

            const pageData = data as PageResponse<Cliente>
            setClientes(pageData.content)
            setTotalPages(pageData.totalPages)
            setTotalElements(pageData.totalElements)
        } catch (requestError) {
            if (isAbortError(requestError)) return
            const message =
                requestError instanceof Error ? requestError.message : "Error inesperado"
            setError(message)
            toast.error(message)
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false)
            }
        }
    }, [])

    const fetchBuscar = useCallback(async (query: string, pageNumber: number) => {
        searchAbortRef.current?.abort()
        const controller = new AbortController()
        searchAbortRef.current = controller

        setSearching(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                q: query.trim(),
                page: String(pageNumber),
            })

            const response = await authFetch(`/api/cliente/buscar?${params.toString()}`, {
                signal: controller.signal,
            })
            const data = await parseJsonSafe(response)
            if (controller.signal.aborted) return

            if (!response.ok) {
                const message = getErrorMessage(response.status, data?.message)
                setError(message)
                toast.error(message)
                setSearchResults([])
                setSearchTotals({ totalPages: 0, totalElements: 0 })
                return
            }

            const pageData = data as PageResponse<Cliente>
            setSearchResults(pageData.content)
            setSearchTotals({
                totalPages: pageData.totalPages,
                totalElements: pageData.totalElements,
            })
        } catch (requestError) {
            if (isAbortError(requestError)) return
            const message =
                requestError instanceof Error ? requestError.message : "Error inesperado"
            setError(message)
            toast.error(message)
        } finally {
            if (!controller.signal.aborted) {
                setSearching(false)
            }
        }
    }, [])

    useEffect(() => {
        if (isAuthLoading || isSearchMode) return
        fetchClientes(page)
    }, [fetchClientes, isAuthLoading, isSearchMode, page])

    useEffect(() => {
        if (isAuthLoading) return

        if (!isSearchMode) {
            setSearchResults([])
            setSearchTotals({ totalPages: 0, totalElements: 0 })
            setSearching(false)
            return
        }

        fetchBuscar(debouncedSearch, searchPage)
    }, [debouncedSearch, fetchBuscar, isAuthLoading, isSearchMode, searchPage])

    useEffect(() => {
        return () => {
            listAbortRef.current?.abort()
            searchAbortRef.current?.abort()
        }
    }, [])

    const refreshCurrentView = useCallback(async () => {
        if (isSearchMode) {
            await fetchBuscar(debouncedSearch, searchPage)
            return
        }

        await fetchClientes(page)
    }, [debouncedSearch, fetchBuscar, fetchClientes, isSearchMode, page, searchPage])

    const createCliente = useCallback(
        async (payload: ClienteCreateRequest) => {
            try {
                const response = await authFetch("/api/cliente/insertar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })

                const data = await parseJsonSafe(response)

                if (!response.ok) {
                    const message = getErrorMessage(response.status, data?.message)
                    setError(message)
                    toast.error(message)
                    return false
                }

                toast.success("Cliente creado exitosamente")
                await refreshCurrentView()
                return true
            } catch (requestError) {
                const message =
                    requestError instanceof Error ? requestError.message : "Error inesperado"
                setError(message)
                toast.error(message)
                return false
            }
        },
        [refreshCurrentView]
    )

    const updateCliente = useCallback(
        async (id: number, payload: ClienteUpdateRequest) => {
            try {
                const response = await authFetch(`/api/cliente/actualizar/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })

                const data = await parseJsonSafe(response)

                if (!response.ok) {
                    const message = getErrorMessage(response.status, data?.message)
                    setError(message)
                    toast.error(message)
                    return false
                }

                toast.success(data?.message ?? "Cliente actualizado exitosamente")
                await refreshCurrentView()
                return true
            } catch (requestError) {
                const message =
                    requestError instanceof Error ? requestError.message : "Error inesperado"
                setError(message)
                toast.error(message)
                return false
            }
        },
        [refreshCurrentView]
    )

    const deleteCliente = useCallback(
        async (id: number) => {
            try {
                const response = await authFetch(`/api/cliente/eliminar/${id}`, {
                    method: "DELETE",
                })

                const data = await parseJsonSafe(response)

                if (!response.ok) {
                    const message = getErrorMessage(response.status, data?.message)
                    setError(message)
                    toast.error(message)
                    return false
                }

                toast.success(data?.message ?? "Cliente eliminado lÃ³gicamente")

                setClientes((previous) => previous.filter((c) => c.idCliente !== id))
                setTotalElements((previous) => Math.max(0, previous - 1))

                await refreshCurrentView()
                return true
            } catch (requestError) {
                const message =
                    requestError instanceof Error ? requestError.message : "Error inesperado"
                setError(message)
                toast.error(message)
                return false
            }
        },
        [refreshCurrentView]
    )

    const displayedClientes = useMemo(
        () => (isSearchMode ? searchResults : clientes),
        [clientes, isSearchMode, searchResults]
    )
    const displayedTotalPages = isSearchMode ? searchTotals.totalPages : totalPages
    const displayedTotalElements = isSearchMode
        ? searchTotals.totalElements
        : totalElements
    const displayedPage = isSearchMode ? searchPage : page
    const displayedLoading = isSearchMode ? searching : loading

    const setDisplayedPage = useCallback<Dispatch<SetStateAction<number>>>(
        (value) => {
            if (isSearchMode) {
                setSearchPage(value)
                return
            }

            setPage(value)
        },
        [isSearchMode]
    )

    return {
        clientes,
        page,
        totalPages,
        totalElements,
        loading,
        error,

        search,
        debouncedSearch,
        isSearchMode,
        searchResults,
        searchPage,
        searchTotals,
        searching,

        displayedClientes,
        displayedTotalPages,
        displayedTotalElements,
        displayedPage,
        displayedLoading,
        setDisplayedPage,

        setSearch,
        setPage,
        setSearchPage,
        fetchClientes,
        fetchBuscar,
        refreshCurrentView,
        createCliente,
        updateCliente,
        deleteCliente,
    }
}
