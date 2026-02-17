"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type {
  PageResponse,
  Sucursal,
  SucursalCreateRequest,
  SucursalUpdateRequest,
} from "@/lib/types/sucursal"

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

export function useSucursales() {
  const { isLoading: isAuthLoading } = useAuth()

  const [sucursales, setSucursales] = useState<Sucursal[]>([])
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
  const [searchResults, setSearchResults] = useState<Sucursal[]>([])
  const [searchTotals, setSearchTotals] = useState<SearchTotals>({
    totalPages: 0,
    totalElements: 0,
  })
  const [searching, setSearching] = useState(false)

  const listAbortRef = useRef<AbortController | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  const isSearchMode = debouncedSearch.trim().length > 0

  const fetchSucursales = useCallback(async (pageNumber: number) => {
    listAbortRef.current?.abort()
    const controller = new AbortController()
    listAbortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(`/api/sucursal/listar?page=${pageNumber}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        toast.error(message)
        setSucursales([])
        setTotalPages(0)
        setTotalElements(0)
        return
      }

      const pageData = data as PageResponse<Sucursal> | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const nextTotalPages =
        typeof pageData?.totalPages === "number" ? pageData.totalPages : 0
      const nextTotalElements =
        typeof pageData?.totalElements === "number" ? pageData.totalElements : 0

      setSucursales(content)
      setTotalPages(nextTotalPages)
      setTotalElements(nextTotalElements)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
      setSucursales([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  const fetchBuscar = useCallback(async (query: string, pageNumber: number) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchTotals({ totalPages: 0, totalElements: 0 })
      return
    }

    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller

    setSearching(true)
    setError(null)

    try {
      const response = await authFetch(
        `/api/sucursal/buscar?q=${encodeURIComponent(query)}&page=${pageNumber}`,
        { signal: controller.signal }
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

      const pageData = data as PageResponse<Sucursal> | null
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

  const refreshCurrentCollection = useCallback(async () => {
    if (isSearchMode) {
      await fetchBuscar(debouncedSearch, searchPage)
      return
    }
    await fetchSucursales(page)
  }, [debouncedSearch, fetchBuscar, fetchSucursales, isSearchMode, page, searchPage])

  useEffect(() => {
    if (isAuthLoading) return
    fetchSucursales(page)
  }, [fetchSucursales, isAuthLoading, page])

  useEffect(() => {
    if (isAuthLoading) return

    if (!debouncedSearch.trim()) {
      setSearchResults([])
      setSearchTotals({ totalPages: 0, totalElements: 0 })
      setSearching(false)
      return
    }

    fetchBuscar(debouncedSearch, searchPage)
  }, [debouncedSearch, fetchBuscar, isAuthLoading, searchPage])

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort()
      searchAbortRef.current?.abort()
    }
  }, [])

  const createSucursal = useCallback(
    async (payload: SucursalCreateRequest) => {
      try {
        const response = await authFetch("/api/sucursal/insertar", {
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

        toast.success(data?.message ?? "Sucursal registrada exitosamente")
        await refreshCurrentCollection()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [refreshCurrentCollection]
  )

  const updateSucursal = useCallback(
    async (id: number, payload: SucursalUpdateRequest) => {
      try {
        const response = await authFetch(`/api/sucursal/actualizar/${id}`, {
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

        toast.success(data?.message ?? "Sucursal actualizada exitosamente")
        await refreshCurrentCollection()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [refreshCurrentCollection]
  )

  const deleteSucursal = useCallback(
    async (id: number) => {
      try {
        const response = await authFetch(`/api/sucursal/eliminar/${id}`, {
          method: "DELETE",
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? "Sucursal eliminada logicamente")

        setSucursales((previous) =>
          (Array.isArray(previous) ? previous : []).filter(
            (sucursal) => sucursal.idSucursal !== id
          )
        )
        setSearchResults((previous) =>
          (Array.isArray(previous) ? previous : []).filter(
            (sucursal) => sucursal.idSucursal !== id
          )
        )
        setTotalElements((previous) => Math.max(0, previous - 1))
        setSearchTotals((previous) => ({
          ...previous,
          totalElements: Math.max(0, previous.totalElements - 1),
        }))

        await refreshCurrentCollection()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Error inesperado"
        setError(message)
        toast.error(message)
        return false
      }
    },
    [refreshCurrentCollection]
  )

  const displayedSucursales = useMemo(
    () => (isSearchMode ? searchResults : sucursales),
    [isSearchMode, searchResults, sucursales]
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

  const activeCount = useMemo(
    () =>
      (Array.isArray(displayedSucursales) ? displayedSucursales : []).filter(
        (sucursal) => sucursal.estado === "ACTIVO"
      ).length,
    [displayedSucursales]
  )

  return {
    sucursales,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    activeCount,
    search,
    debouncedSearch,
    isSearchMode,
    searchResults,
    searchPage,
    searchTotals,
    searching,
    displayedSucursales,
    displayedTotalPages,
    displayedTotalElements,
    displayedPage,
    displayedLoading,
    setDisplayedPage,
    setSearch,
    setPage,
    setSearchPage,
    fetchSucursales,
    fetchBuscar,
    createSucursal,
    updateSucursal,
    deleteSucursal,
  }
}
