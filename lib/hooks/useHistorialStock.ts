"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  HistorialStock,
  PageResponse,
} from "@/lib/types/historial-stock"

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

export function useHistorialStock() {
  const { isLoading: isAuthLoading } = useAuth()

  const [movimientos, setMovimientos] = useState<HistorialStock[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const fetchMovimientos = useCallback(async (pageNumber: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ page: String(pageNumber) })
      const response = await authFetch(`/api/historial-stock/listar?${params.toString()}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        toast.error(message)
        setMovimientos([])
        setTotalPages(0)
        setTotalElements(0)
        return
      }

      const pageData = data as PageResponse<HistorialStock> | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const nextTotalPages =
        typeof pageData?.totalPages === "number" ? pageData.totalPages : 0
      const nextTotalElements =
        typeof pageData?.totalElements === "number" ? pageData.totalElements : 0

      setMovimientos(content)
      setTotalPages(nextTotalPages)
      setTotalElements(nextTotalElements)
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
      setMovimientos([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthLoading) return
    fetchMovimientos(page)
  }, [fetchMovimientos, isAuthLoading, page])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const setPageSafe = useCallback<Dispatch<SetStateAction<number>>>(
    (value) => setPage(value),
    []
  )

  return {
    movimientos,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    setPage: setPageSafe,
    refresh: () => fetchMovimientos(page),
  }
}
