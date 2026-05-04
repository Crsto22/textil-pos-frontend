"use client"

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import { normalizeGuiaTransportePageResponse } from "@/lib/types/guia-transporte"

interface UseGuiaTransporteCrudConfig<TItem> {
  idGuiaRemision: number | null
  subpath: "conductores" | "vehiculos"
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
  if (status === 404) return "Guia de remision no encontrada"
  if (status === 409) return "La guia no esta en estado BORRADOR"
  if (status === 500) return "Error interno del servidor"
  return fallback
}

export function useGuiaTransporteCrud<TItem, TPayload>({
  idGuiaRemision,
  subpath,
  singularLabel,
  pluralLabel,
  normalizeItem,
}: UseGuiaTransporteCrudConfig<TItem>) {
  const { isLoading: isAuthLoading } = useAuth()

  const [items, setItems] = useState<TItem[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const abortRef = useRef<AbortController | null>(null)

  const resetPage = useCallback(() => {
    setPage(0)
  }, [])

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, resetPage)

  // Reset state when guia changes
  useEffect(() => {
    setItems([])
    setPage(0)
    setTotalPages(0)
    setTotalElements(0)
    setError(null)
    setSearch("")
  }, [idGuiaRemision])

  const buildEndpoint = useCallback(
    (pageNumber: number, query: string): string => {
      const params = new URLSearchParams({ page: String(pageNumber) })
      if (query.trim()) params.set("q", query.trim())
      return `/api/guia-remision/${idGuiaRemision}/${subpath}?${params.toString()}`
    },
    [idGuiaRemision, subpath]
  )

  const fetchItems = useCallback(
    async (pageNumber: number, query: string) => {
      if (!idGuiaRemision) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const response = await authFetch(buildEndpoint(pageNumber, query), {
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

        const pageData = normalizeGuiaTransportePageResponse(data, normalizeItem)
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
    [buildEndpoint, idGuiaRemision, normalizeItem, pluralLabel]
  )

  useEffect(() => {
    if (isAuthLoading || !idGuiaRemision) return
    void fetchItems(page, debouncedSearch)
  }, [debouncedSearch, fetchItems, idGuiaRemision, isAuthLoading, page])

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
      if (!idGuiaRemision) return false
      try {
        const response = await authFetch(
          `/api/guia-remision/${idGuiaRemision}/${subpath}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        )
        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getRequestErrorMessage(
            response.status,
            data?.message,
            `No se pudo crear ${singularLabel}`
          )
          toast.error(message)
          return false
        }

        toast.success(`${singularLabel} creado correctamente`)
        await refreshCurrentView()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : `Error al crear ${singularLabel}`
        toast.error(message)
        return false
      }
    },
    [idGuiaRemision, subpath, singularLabel, refreshCurrentView]
  )

  const updateItem = useCallback(
    async (id: number, payload: TPayload) => {
      if (!idGuiaRemision) return false
      try {
        const response = await authFetch(
          `/api/guia-remision/${idGuiaRemision}/${subpath}/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        )
        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getRequestErrorMessage(
            response.status,
            data?.message,
            `No se pudo actualizar ${singularLabel}`
          )
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
        toast.error(message)
        return false
      }
    },
    [idGuiaRemision, subpath, singularLabel, refreshCurrentView]
  )

  const deleteItem = useCallback(
    async (id: number) => {
      if (!idGuiaRemision) return false
      try {
        const response = await authFetch(
          `/api/guia-remision/${idGuiaRemision}/${subpath}/${id}`,
          { method: "DELETE" }
        )
        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message = getRequestErrorMessage(
            response.status,
            data?.message,
            `No se pudo eliminar ${singularLabel}`
          )
          toast.error(message)
          return false
        }

        toast.success(data?.message ?? `${singularLabel} eliminado correctamente`)
        await refreshCurrentView()
        return true
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : `Error al eliminar ${singularLabel}`
        toast.error(message)
        return false
      }
    },
    [idGuiaRemision, subpath, singularLabel, refreshCurrentView]
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
