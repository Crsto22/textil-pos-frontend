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
  PageResponse,
  Talla,
  TallaCreateRequest,
  TallaDeleteResponse,
  TallaUpdateRequest,
} from "@/lib/types/talla"

interface SearchTotals {
  totalPages: number
  totalElements: number
}

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
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

function isTallaEntity(value: unknown): value is Talla {
  if (!value || typeof value !== "object") return false

  return (
    "idTalla" in value &&
    typeof value.idTalla === "number" &&
    "nombre" in value &&
    typeof value.nombre === "string" &&
    "estado" in value &&
    typeof value.estado === "string"
  )
}

function getTallaFromCreatePayload(payload: unknown): Talla | null {
  if (isTallaEntity(payload)) return payload
  if (!payload || typeof payload !== "object") return null

  const payloadRecord = payload as Record<string, unknown>

  for (const key of ["talla", "data", "payload", "result"]) {
    const candidate = payloadRecord[key]
    if (isTallaEntity(candidate)) {
      return candidate
    }
  }

  return null
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase()
}

function findExactTallaMatch(tallas: Talla[], nombre: string) {
  const normalizedNombre = normalizeName(nombre)
  if (!normalizedNombre) return null

  return (
    tallas.find((talla) => normalizeName(talla.nombre) === normalizedNombre) ?? null
  )
}

interface CreateTallaResult {
  success: boolean
  talla: Talla | null
}

export function useTallas() {
  const { isLoading: isAuthLoading } = useAuth()

  const [tallas, setTallas] = useState<Talla[]>([])
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
  const [searchResults, setSearchResults] = useState<Talla[]>([])
  const [searchTotals, setSearchTotals] = useState<SearchTotals>({
    totalPages: 0,
    totalElements: 0,
  })
  const [searching, setSearching] = useState(false)

  const listAbortRef = useRef<AbortController | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  const isSearchMode = debouncedSearch.trim().length > 0

  const fetchTallas = useCallback(async (pageNumber: number) => {
    listAbortRef.current?.abort()
    const controller = new AbortController()
    listAbortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(`/api/talla/listar?page=${pageNumber}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        toast.error(message)
        setTallas([])
        setTotalPages(0)
        setTotalElements(0)
        return
      }

      const pageData = data as PageResponse<Talla> | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const nextTotalPages =
        typeof pageData?.totalPages === "number" ? pageData.totalPages : 0
      const nextTotalElements =
        typeof pageData?.totalElements === "number" ? pageData.totalElements : 0

      setTallas(content)
      setTotalPages(nextTotalPages)
      setTotalElements(nextTotalElements)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
      setTallas([])
      setTotalPages(0)
      setTotalElements(0)
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

      const response = await authFetch(`/api/talla/buscar?${params.toString()}`, {
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

      const pageData = data as PageResponse<Talla> | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const nextTotalPages =
        typeof pageData?.totalPages === "number" ? pageData.totalPages : 0
      const nextTotalElements =
        typeof pageData?.totalElements === "number" ? pageData.totalElements : 0

      setSearchResults(content)
      setSearchTotals({
        totalPages: nextTotalPages,
        totalElements: nextTotalElements,
      })
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
      setSearchResults([])
      setSearchTotals({ totalPages: 0, totalElements: 0 })
    } finally {
      if (!controller.signal.aborted) {
        setSearching(false)
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthLoading || isSearchMode) return
    fetchTallas(page)
  }, [fetchTallas, isAuthLoading, isSearchMode, page])

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

    await fetchTallas(page)
  }, [debouncedSearch, fetchBuscar, fetchTallas, isSearchMode, page, searchPage])

  const findTallaByName = useCallback(async (nombre: string) => {
    const trimmedNombre = nombre.trim()
    if (!trimmedNombre) return null

    try {
      const params = new URLSearchParams({
        q: trimmedNombre,
        page: "0",
      })

      const response = await authFetch(`/api/talla/buscar?${params.toString()}`)
      const data = await parseJsonSafe(response)
      if (!response.ok) return null

      const pageData = data as PageResponse<Talla> | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []

      return findExactTallaMatch(content, trimmedNombre) ?? null
    } catch {
      return null
    }
  }, [])

  const createTallaAndReturn = useCallback(
    async (payload: TallaCreateRequest): Promise<CreateTallaResult> => {
      try {
        const response = await authFetch("/api/talla/insertar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return { success: false, talla: null }
        }

        toast.success("Talla creada exitosamente")
        await refreshCurrentView()
        return {
          success: true,
          talla:
            getTallaFromCreatePayload(data) ??
            (await findTallaByName(payload.nombre)),
        }
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return { success: false, talla: null }
      }
    },
    [findTallaByName, refreshCurrentView]
  )

  const createTalla = useCallback(
    async (payload: TallaCreateRequest) => {
      const result = await createTallaAndReturn(payload)
      return result.success
    },
    [createTallaAndReturn]
  )

  const deleteTalla = useCallback(
    async (id: number) => {
      try {
        const response = await authFetch(`/api/talla/eliminar/${id}`, {
          method: "DELETE",
        })

        const data = (await parseJsonSafe(response)) as TallaDeleteResponse | null

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? "Talla eliminada correctamente")

        setTallas((previous) => previous.filter((talla) => talla.idTalla !== id))
        setSearchResults((previous) =>
          previous.filter((talla) => talla.idTalla !== id)
        )
        setTotalElements((previous) => Math.max(0, previous - 1))
        setSearchTotals((previous) => ({
          ...previous,
          totalElements: Math.max(0, previous.totalElements - 1),
        }))

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

  const updateTalla = useCallback(
    async (id: number, payload: TallaUpdateRequest) => {
      try {
        const response = await authFetch(`/api/talla/actualizar/${id}`, {
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

        toast.success("Talla actualizada exitosamente")
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

  const displayedTallas = useMemo(
    () => (isSearchMode ? searchResults : tallas),
    [isSearchMode, searchResults, tallas]
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
    tallas,
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
    displayedTallas,
    displayedTotalPages,
    displayedTotalElements,
    displayedPage,
    displayedLoading,
    setDisplayedPage,
    setSearch,
    setPage,
    setSearchPage,
    fetchTallas,
    fetchBuscar,
    refreshCurrentView,
    createTallaAndReturn,
    createTalla,
    updateTalla,
    deleteTalla,
  }
}
