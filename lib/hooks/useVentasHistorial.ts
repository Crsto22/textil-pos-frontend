"use client"

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { VentaHistorial, VentaHistorialPageResponse } from "@/lib/types/venta"

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para listar ventas"
  if (status === 500) return "Error interno del servidor"
  return "Error inesperado al cargar el historial"
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function normalizeVenta(value: unknown): VentaHistorial | null {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>

  const idVenta = Number(item.idVenta)
  if (!Number.isFinite(idVenta) || idVenta <= 0) return null

  return {
    idVenta,
    fecha: typeof item.fecha === "string" ? item.fecha : "",
    tipoComprobante:
      typeof item.tipoComprobante === "string" ? item.tipoComprobante : "TICKET",
    serie: typeof item.serie === "string" ? item.serie : "",
    correlativo: Number(item.correlativo) || 0,
    total: Number(item.total) || 0,
    estado: typeof item.estado === "string" ? item.estado : "DESCONOCIDO",
    idCliente: Number.isFinite(Number(item.idCliente)) ? Number(item.idCliente) : null,
    nombreCliente: typeof item.nombreCliente === "string" ? item.nombreCliente : "Sin cliente",
    idUsuario: Number.isFinite(Number(item.idUsuario)) ? Number(item.idUsuario) : null,
    nombreUsuario: typeof item.nombreUsuario === "string" ? item.nombreUsuario : "Sin usuario",
    idSucursal: Number.isFinite(Number(item.idSucursal)) ? Number(item.idSucursal) : null,
    nombreSucursal: typeof item.nombreSucursal === "string" ? item.nombreSucursal : "Sin sucursal",
    items: Number(item.items) || 0,
    pagos: Number(item.pagos) || 0,
  }
}

export function useVentasHistorial() {
  const { isLoading: isAuthLoading } = useAuth()

  const [ventas, setVentas] = useState<VentaHistorial[]>([])
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [numberOfElements, setNumberOfElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const listAbortRef = useRef<AbortController | null>(null)

  const fetchVentas = useCallback(async (pageNumber: number) => {
    listAbortRef.current?.abort()
    const controller = new AbortController()
    listAbortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(`/api/venta/listar?page=${pageNumber}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        setVentas([])
        setTotalPages(0)
        setTotalElements(0)
        setNumberOfElements(0)
        toast.error(message)
        return
      }

      const pageData = data as VentaHistorialPageResponse | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const normalizedContent = content
        .map((item) => normalizeVenta(item))
        .filter((item): item is VentaHistorial => item !== null)

      setVentas(normalizedContent)
      setPage(typeof pageData?.page === "number" ? pageData.page : pageNumber)
      setSize(typeof pageData?.size === "number" ? pageData.size : 10)
      setTotalPages(typeof pageData?.totalPages === "number" ? pageData.totalPages : 0)
      setTotalElements(typeof pageData?.totalElements === "number" ? pageData.totalElements : 0)
      setNumberOfElements(
        typeof pageData?.numberOfElements === "number"
          ? pageData.numberOfElements
          : normalizedContent.length
      )
    } catch (requestError) {
      if (isAbortError(requestError)) return
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado"
      setError(message)
      setVentas([])
      setTotalPages(0)
      setTotalElements(0)
      setNumberOfElements(0)
      toast.error(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthLoading) return
    void fetchVentas(page)
  }, [fetchVentas, isAuthLoading, page])

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort()
    }
  }, [])

  const refreshVentas = useCallback(async () => {
    await fetchVentas(page)
  }, [fetchVentas, page])

  const setDisplayedPage = useCallback<Dispatch<SetStateAction<number>>>((value) => {
    setPage((previous) => {
      const next = typeof value === "function" ? value(previous) : value
      if (!Number.isFinite(next)) return previous
      if (next < 0) return 0
      return totalPages > 0 ? Math.min(next, totalPages - 1) : 0
    })
  }, [totalPages])

  return {
    ventas,
    page,
    size,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setPage,
    setDisplayedPage,
    fetchVentas,
    refreshVentas,
  }
}
