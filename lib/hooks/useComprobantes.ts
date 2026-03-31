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
import { normalizeComprobante, normalizeComprobantePageResponse } from "@/lib/comprobante"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type {
  ComprobanteConfig,
  ComprobanteCreateRequest,
  ComprobanteUpdateRequest,
} from "@/lib/types/comprobante"

type ComprobanteActivoFilter = "TODOS" | "ACTIVO" | "INACTIVO"

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

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export function useComprobantes() {
  const { isLoading: isAuthLoading, user } = useAuth()

  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userSucursalId = hasValidSucursalId(user?.idSucursal)
    ? user.idSucursal
    : null

  const [comprobantes, setComprobantes] = useState<ComprobanteConfig[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
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
  const [searchResults, setSearchResults] = useState<ComprobanteConfig[]>([])
  const [searchTotals, setSearchTotals] = useState<SearchTotals>({
    totalPages: 0,
    totalElements: 0,
  })
  const [searching, setSearching] = useState(false)

  const [activoFilter, setActivoFilter] =
    useState<ComprobanteActivoFilter>("TODOS")
  const [idSucursalFilter, setIdSucursalFilter] = useState<number | null>(null)

  const listAbortRef = useRef<AbortController | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  const hasSucursalFilter = hasValidSucursalId(idSucursalFilter)
  const canListWithoutSucursalFilter = isAdmin
  const canLoadComprobantes =
    hasSucursalFilter || canListWithoutSucursalFilter
  const needsSucursalSelection = !isAdmin && !hasSucursalFilter
  const isSearchMode = debouncedSearch.trim().length > 0

  useEffect(() => {
    if (isAdmin) {
      return
    }

    setIdSucursalFilter(userSucursalId)
  }, [isAdmin, userSucursalId])

  const fetchComprobantes = useCallback(
    async (
      pageNumber: number,
      sucursalId: number | null,
      activo: ComprobanteActivoFilter
    ) => {
      listAbortRef.current?.abort()
      const controller = new AbortController()
      listAbortRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          page: String(pageNumber),
        })

        if (activo !== "TODOS") {
          params.set("activo", activo)
        }

        if (hasValidSucursalId(sucursalId)) {
          params.set("idSucursal", String(sucursalId))
        }

        const response = await authFetch(
          `/api/config/comprobantes/listar?${params.toString()}`,
          {
            signal: controller.signal,
          }
        )
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          setComprobantes([])
          setTotalPages(0)
          setTotalElements(0)
          return
        }

        const pageData = normalizeComprobantePageResponse(data)
        setComprobantes(pageData.content)
        setTotalPages(pageData.totalPages)
        setTotalElements(pageData.totalElements)
      } catch (requestError) {
        if (isAbortError(requestError)) return
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        setComprobantes([])
        setTotalPages(0)
        setTotalElements(0)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    []
  )

  const fetchBuscar = useCallback(
    async (
      query: string,
      pageNumber: number,
      sucursalId: number | null,
      activo: ComprobanteActivoFilter
    ) => {
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

        if (activo !== "TODOS") {
          params.set("activo", activo)
        }

        if (hasValidSucursalId(sucursalId)) {
          params.set("idSucursal", String(sucursalId))
        }

        const response = await authFetch(
          `/api/config/comprobantes/buscar?${params.toString()}`,
          {
            signal: controller.signal,
          }
        )
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

        const pageData = normalizeComprobantePageResponse(data)
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
        setSearchResults([])
        setSearchTotals({ totalPages: 0, totalElements: 0 })
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    if (isAuthLoading) return

    if (!canLoadComprobantes) {
      listAbortRef.current?.abort()
      setComprobantes([])
      setTotalPages(0)
      setTotalElements(0)
      setLoading(false)

      if (!isAdmin) {
        setError("Tu usuario no tiene una sucursal asignada.")
      } else {
        setError(null)
      }
      return
    }

    if (isSearchMode) return
    void fetchComprobantes(page, idSucursalFilter, activoFilter)
  }, [
    activoFilter,
    canLoadComprobantes,
    fetchComprobantes,
    idSucursalFilter,
    isAdmin,
    isAuthLoading,
    isSearchMode,
    page,
  ])

  useEffect(() => {
    if (isAuthLoading) return

    if (!canLoadComprobantes) {
      searchAbortRef.current?.abort()
      setSearchResults([])
      setSearchTotals({ totalPages: 0, totalElements: 0 })
      setSearching(false)
      return
    }

    if (!isSearchMode) {
      setSearchResults([])
      setSearchTotals({ totalPages: 0, totalElements: 0 })
      setSearching(false)
      return
    }

    void fetchBuscar(debouncedSearch, searchPage, idSucursalFilter, activoFilter)
  }, [
    activoFilter,
    canLoadComprobantes,
    debouncedSearch,
    fetchBuscar,
    idSucursalFilter,
    isAuthLoading,
    isSearchMode,
    searchPage,
  ])

  useEffect(() => {
    setPage(0)
    setSearchPage(0)
  }, [activoFilter, idSucursalFilter])

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort()
      searchAbortRef.current?.abort()
    }
  }, [])

  const refreshCurrentView = useCallback(async () => {
    if (!canLoadComprobantes) return

    if (isSearchMode) {
      await fetchBuscar(debouncedSearch, searchPage, idSucursalFilter, activoFilter)
      return
    }

    await fetchComprobantes(page, idSucursalFilter, activoFilter)
  }, [
    activoFilter,
    canLoadComprobantes,
    debouncedSearch,
    fetchBuscar,
    fetchComprobantes,
    idSucursalFilter,
    isSearchMode,
    page,
    searchPage,
  ])

  const fetchComprobanteDetalle = useCallback(async (id: number) => {
    try {
      const response = await authFetch(`/api/config/comprobantes/${id}`, {
        cache: "no-store",
      })
      const data = await parseJsonSafe(response)

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        toast.error(message)
        return null
      }

      return normalizeComprobante(data)
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
      return null
    }
  }, [])

  const createComprobante = useCallback(
    async (payload: ComprobanteCreateRequest) => {
      try {
        const response = await authFetch("/api/config/comprobantes", {
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

        toast.success("Comprobante creado exitosamente")
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

  const updateComprobante = useCallback(
    async (id: number, payload: ComprobanteUpdateRequest) => {
      try {
        const response = await authFetch(`/api/config/comprobantes/${id}`, {
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

        toast.success("Comprobante actualizado exitosamente")
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

  const displayedComprobantes = useMemo(
    () => (isSearchMode ? searchResults : comprobantes),
    [comprobantes, isSearchMode, searchResults]
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
    isAdmin,
    error,
    search,
    setSearch,
    debouncedSearch,
    activoFilter,
    setActivoFilter,
    idSucursalFilter,
    setIdSucursalFilter,
    needsSucursalSelection,
    displayedComprobantes,
    displayedTotalPages,
    displayedTotalElements,
    displayedPage,
    displayedLoading,
    setDisplayedPage,
    refreshCurrentView,
    fetchComprobanteDetalle,
    createComprobante,
    updateComprobante,
  }
}
