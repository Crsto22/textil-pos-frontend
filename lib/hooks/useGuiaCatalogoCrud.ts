"use client"

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import { normalizeCatalogPageResponse } from "@/lib/types/guia-remision-catalogos"

interface UseGuiaCatalogoCrudConfig<TItem> {
  endpoint: string
  singularLabel: string
  pluralLabel: string
  normalizeItem: (value: unknown) => TItem | null
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function getRequestErrorMessage(status: number, backendMessage: unknown, fallback: string) {
  if (typeof backendMessage === "string" && backendMessage.trim()) {
    return backendMessage
  }

  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos"
  if (status === 500) return "Error interno del servidor"
  return fallback
}

export function useGuiaCatalogoCrud<TItem, TPayload>({
  endpoint,
  singularLabel,
  pluralLabel,
  normalizeItem,
}: UseGuiaCatalogoCrudConfig<TItem>) {
  const { isLoading: isAuthLoading } = useAuth()

  const [items, setItems] = useState<TItem[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const abortRef = useRef<AbortController | null>(null)

  const resetPage = useCallback(() => {
    setPage(0)
  }, [])

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, resetPage)

  const fetchItems = useCallback(
    async (pageNumber: number, query: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ page: String(pageNumber) })
        if (query.trim()) {
          params.set("q", query.trim())
        }

        const response = await authFetch(`${endpoint}?${params.toString()}`, {
          signal: controller.signal,
        })
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          const message = getRequestErrorMessage(
            response.status,
            data?.message,
            `No se pudo cargar ${pluralLabel}`
          )
          setError(message)
          setItems([])
          setTotalPages(0)
          setTotalElements(0)
          toast.error(message)
          return
        }

        const pageData = normalizeCatalogPageResponse(data, normalizeItem)
        setItems(pageData.content)
        setPage(pageData.page)
        setTotalPages(pageData.totalPages)
        setTotalElements(pageData.totalElements)
      } catch (requestError) {
        if (isAbortError(requestError)) return

        const message =
          requestError instanceof Error ? requestError.message : `Error al cargar ${pluralLabel}`
        setError(message)
        setItems([])
        setTotalPages(0)
        setTotalElements(0)
        toast.error(message)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [endpoint, normalizeItem, pluralLabel]
  )

  useEffect(() => {
    if (isAuthLoading) return
    void fetchItems(page, debouncedSearch)
  }, [debouncedSearch, fetchItems, isAuthLoading, page])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const refreshCurrentView = useCallback(async () => {
    await fetchItems(page, debouncedSearch)
  }, [debouncedSearch, fetchItems, page])

  const createItem = useCallback(
    async (payload: TPayload) => {
      try {
        const response = await authFetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getRequestErrorMessage(
            response.status,
            data?.message,
            `No se pudo crear ${singularLabel}`
          )
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(`${singularLabel} creado correctamente`)
        await refreshCurrentView()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : `Error al crear ${singularLabel}`
        setError(message)
        toast.error(message)
        return false
      }
    },
    [endpoint, refreshCurrentView, singularLabel]
  )

  const updateItem = useCallback(
    async (id: number, payload: TPayload) => {
      try {
        const response = await authFetch(`${endpoint}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getRequestErrorMessage(
            response.status,
            data?.message,
            `No se pudo actualizar ${singularLabel}`
          )
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(`${singularLabel} actualizado correctamente`)
        await refreshCurrentView()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : `Error al actualizar ${singularLabel}`
        setError(message)
        toast.error(message)
        return false
      }
    },
    [endpoint, refreshCurrentView, singularLabel]
  )

  const deleteItem = useCallback(
    async (id: number) => {
      try {
        const response = await authFetch(`${endpoint}/${id}`, {
          method: "DELETE",
        })

        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getRequestErrorMessage(
            response.status,
            data?.message,
            `No se pudo eliminar ${singularLabel}`
          )
          setError(message)
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? `${singularLabel} eliminado correctamente`)
        await refreshCurrentView()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : `Error al eliminar ${singularLabel}`
        setError(message)
        toast.error(message)
        return false
      }
    },
    [endpoint, refreshCurrentView, singularLabel]
  )

  const setDisplayedPage = useCallback<Dispatch<SetStateAction<number>>>(
    (value) => {
      setPage((previous) => {
        const next = typeof value === "function" ? value(previous) : value
        if (!Number.isFinite(next)) return previous
        if (next < 0) return 0
        return totalPages > 0 ? Math.min(next, totalPages - 1) : 0
      })
    },
    [totalPages]
  )

  return {
    items,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    search,
    setSearch,
    setDisplayedPage,
    refreshCurrentView,
    createItem,
    updateItem,
    deleteItem,
  }
}
