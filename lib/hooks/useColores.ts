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
  Color,
  ColorCreateRequest,
  ColorDeleteResponse,
  ColorUpdateRequest,
  PageResponse,
} from "@/lib/types/color"

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

export function useColores() {
  const { isLoading: isAuthLoading } = useAuth()

  const [colores, setColores] = useState<Color[]>([])
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
  const [searchResults, setSearchResults] = useState<Color[]>([])
  const [searchTotals, setSearchTotals] = useState<SearchTotals>({
    totalPages: 0,
    totalElements: 0,
  })
  const [searching, setSearching] = useState(false)

  const listAbortRef = useRef<AbortController | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  const isSearchMode = debouncedSearch.trim().length > 0

  const fetchColores = useCallback(async (pageNumber: number) => {
    listAbortRef.current?.abort()
    const controller = new AbortController()
    listAbortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(`/api/color/listar?page=${pageNumber}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        toast.error(message)
        setColores([])
        setTotalPages(0)
        setTotalElements(0)
        return
      }

      const pageData = data as PageResponse<Color> | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const nextTotalPages =
        typeof pageData?.totalPages === "number" ? pageData.totalPages : 0
      const nextTotalElements =
        typeof pageData?.totalElements === "number" ? pageData.totalElements : 0

      setColores(content)
      setTotalPages(nextTotalPages)
      setTotalElements(nextTotalElements)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
      setColores([])
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

      const response = await authFetch(`/api/color/buscar?${params.toString()}`, {
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

      const pageData = data as PageResponse<Color> | null
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
    fetchColores(page)
  }, [fetchColores, isAuthLoading, isSearchMode, page])

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

    await fetchColores(page)
  }, [debouncedSearch, fetchBuscar, fetchColores, isSearchMode, page, searchPage])

  const createColor = useCallback(
    async (payload: ColorCreateRequest) => {
      try {
        const response = await authFetch("/api/color/insertar", {
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

        toast.success("Color creado exitosamente")
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

  const updateColor = useCallback(
    async (id: number, payload: ColorUpdateRequest) => {
      try {
        const response = await authFetch(`/api/color/actualizar/${id}`, {
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

        toast.success("Color actualizado exitosamente")
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

  const deleteColor = useCallback(
    async (id: number) => {
      try {
        const response = await authFetch(`/api/color/eliminar/${id}`, {
          method: "DELETE",
        })

        const data = (await parseJsonSafe(response)) as ColorDeleteResponse | null

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? "Color eliminado correctamente")

        setColores((previous) => previous.filter((color) => color.idColor !== id))
        setSearchResults((previous) =>
          previous.filter((color) => color.idColor !== id)
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

  const displayedColores = useMemo(
    () => (isSearchMode ? searchResults : colores),
    [colores, isSearchMode, searchResults]
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
    colores,
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
    displayedColores,
    displayedTotalPages,
    displayedTotalElements,
    displayedPage,
    displayedLoading,
    setDisplayedPage,
    setSearch,
    setPage,
    setSearchPage,
    fetchColores,
    fetchBuscar,
    refreshCurrentView,
    createColor,
    updateColor,
    deleteColor,
  }
}
