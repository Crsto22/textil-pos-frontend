"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  PageResponse,
  ProductoImportacionHistorial,
} from "@/lib/types/producto"

function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos"
  if (status === 500) return "Error interno del servidor"
  return "Error inesperado"
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toNullableFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toSafeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function normalizeImportHistoryItem(
  payload: unknown
): ProductoImportacionHistorial | null {
  if (!payload || typeof payload !== "object") return null

  const row = payload as Record<string, unknown>

  return {
    idImportacion: toFiniteNumber(row.idImportacion),
    idUsuario: toNullableFiniteNumber(row.idUsuario),
    nombreUsuario: toSafeString(row.nombreUsuario, "Sin usuario"),
    idSucursal: toNullableFiniteNumber(row.idSucursal),
    nombreSucursal: toSafeString(row.nombreSucursal, "Sin sucursal"),
    nombreArchivo: toSafeString(row.nombreArchivo, "Sin archivo"),
    tamanoBytes: toFiniteNumber(row.tamanoBytes),
    filasProcesadas: toFiniteNumber(row.filasProcesadas),
    productosCreados: toFiniteNumber(row.productosCreados),
    productosActualizados: toFiniteNumber(row.productosActualizados),
    variantesGuardadas: toFiniteNumber(row.variantesGuardadas),
    categoriasCreadas: toFiniteNumber(row.categoriasCreadas),
    coloresCreados: toFiniteNumber(row.coloresCreados),
    tallasCreadas: toFiniteNumber(row.tallasCreadas),
    estado: toSafeString(row.estado, "DESCONOCIDO"),
    mensajeError:
      typeof row.mensajeError === "string"
        ? row.mensajeError
        : row.mensajeError === null
          ? null
          : null,
    duracionMs: toNullableFiniteNumber(row.duracionMs),
    createdAt: toSafeString(row.createdAt),
  }
}

export function useProductoImportHistory() {
  const [history, setHistory] = useState<ProductoImportacionHistorial[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const fetchHistory = useCallback(async (pageNumber: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(
        `/api/producto/importacion-historial/listar?page=${pageNumber}`,
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
        setHistory([])
        setTotalPages(0)
        setTotalElements(0)
        return
      }

      const pageData = data as PageResponse<unknown> | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const normalizedRows = content
        .map(normalizeImportHistoryItem)
        .filter((row): row is ProductoImportacionHistorial => row !== null)

      setHistory(normalizedRows)
      setTotalPages(
        typeof pageData?.totalPages === "number" ? pageData.totalPages : 0
      )
      setTotalElements(
        typeof pageData?.totalElements === "number" ? pageData.totalElements : 0
      )
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      toast.error(message)
      setHistory([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchHistory(page)
  }, [fetchHistory, page])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const refreshHistory = useCallback(async () => {
    await fetchHistory(page)
  }, [fetchHistory, page])

  return {
    history,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    setPage,
    fetchHistory,
    refreshHistory,
  }
}

