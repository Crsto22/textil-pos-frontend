"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  ProductoReporteCategoriaItem,
  ProductoReporteFilters,
  ProductoReporteFiltro,
  ProductoReporteHeatmapItem,
  ProductoReporteKpis,
  ProductoReporteResponse,
  ProductoReporteTopProducto,
} from "@/lib/types/producto-reporte"

const DEFAULT_FILTRO: ProductoReporteFiltro = "ULT_30_DIAS"

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toNullableNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function normalizeFiltro(value: unknown): ProductoReporteFiltro {
  if (
    value === "HOY" ||
    value === "ULT_7_DIAS" ||
    value === "ULT_14_DIAS" ||
    value === "ULT_30_DIAS" ||
    value === "ULT_12_MESES"
  ) {
    return value
  }
  return DEFAULT_FILTRO
}

function normalizeKpis(value: unknown): ProductoReporteKpis {
  const payload = value as Record<string, unknown> | null
  return {
    productosActivos: toFiniteNumber(payload?.productosActivos),
    variantesActivas: toFiniteNumber(payload?.variantesActivas),
    variantesSinStock: toFiniteNumber(payload?.variantesSinStock),
    rotacionPromedio: toFiniteNumber(payload?.rotacionPromedio),
  }
}

function normalizeTopProducto(value: unknown): ProductoReporteTopProducto | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idProducto: toNullableNumber(payload.idProducto),
    producto: toStringValue(payload.producto, "Producto sin nombre"),
    idProductoVariante: toNullableNumber(payload.idProductoVariante),
    variante: toNullableString(payload.variante),
    color: toNullableString(payload.color),
    talla: toNullableString(payload.talla),
    idSucursal: toNullableNumber(payload.idSucursal),
    nombreSucursal: toNullableString(payload.nombreSucursal),
    unidadesVendidas: toFiniteNumber(payload.unidadesVendidas),
    montoVendido: toFiniteNumber(payload.montoVendido),
  }
}

function normalizeHeatmapItem(value: unknown): ProductoReporteHeatmapItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idColor: toNullableNumber(payload.idColor),
    color: toStringValue(payload.color, "Color"),
    codigoColor: toNullableString(payload.codigoColor),
    idTalla: toNullableNumber(payload.idTalla),
    talla: toStringValue(payload.talla, "Sin talla"),
    unidadesVendidas: toFiniteNumber(payload.unidadesVendidas),
    montoVendido: toFiniteNumber(payload.montoVendido),
  }
}

function normalizeCategoriaItem(value: unknown): ProductoReporteCategoriaItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idCategoria: toNullableNumber(payload.idCategoria),
    categoria: toStringValue(payload.categoria, "Sin categoria"),
    unidadesVendidas: toFiniteNumber(payload.unidadesVendidas),
    montoVendido: toFiniteNumber(payload.montoVendido),
  }
}

function normalizeList<T>(
  value: unknown,
  mapper: (item: unknown) => T | null
): T[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => mapper(item)).filter((item): item is T => item !== null)
}

function normalizeProductoReporteResponse(payload: unknown): ProductoReporteResponse {
  const data = payload as Record<string, unknown> | null

  return {
    filtro: normalizeFiltro(data?.filtro),
    desde: toStringValue(data?.desde),
    hasta: toStringValue(data?.hasta),
    idSucursal: toNullableNumber(data?.idSucursal),
    nombreSucursal: toNullableString(data?.nombreSucursal),
    kpis: normalizeKpis(data?.kpis),
    topProductosPorMonto: normalizeList(data?.topProductosPorMonto, normalizeTopProducto),
    topProductosPorUnidades: normalizeList(
      data?.topProductosPorUnidades,
      normalizeTopProducto
    ),
    heatmapVentasPorTallaColor: normalizeList(
      data?.heatmapVentasPorTallaColor,
      normalizeHeatmapItem
    ),
    ventasPorCategoria: normalizeList(data?.ventasPorCategoria, normalizeCategoriaItem),
  }
}

function buildQueryString(filters: ProductoReporteFilters): string {
  const searchParams = new URLSearchParams()
  searchParams.set("filtro", filters.filtro)

  if (typeof filters.idSucursal === "number" && filters.idSucursal > 0) {
    searchParams.set("idSucursal", String(filters.idSucursal))
  }

  return searchParams.toString()
}

function getErrorMessage(status: number, backendMessage?: string): string {
  if (backendMessage) return backendMessage
  if (status === 400) return "Filtros invalidos para generar el reporte de productos"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para consultar este reporte"
  if (status === 404) return "No se encontraron datos para el reporte de productos"
  if (status === 500) return "Error interno del servidor"
  return "No se pudo cargar el reporte de productos"
}

export function useProductoReporte(filters: ProductoReporteFilters, enabled = true) {
  const { isLoading: isAuthLoading } = useAuth()
  const [data, setData] = useState<ProductoReporteResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { filtro, idSucursal } = filters

  const fetchReporte = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!enabled) {
      setLoading(false)
      setError(null)
      setData(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const queryString = buildQueryString({ filtro, idSucursal })
      const response = await authFetch(`/api/producto/reporte?${queryString}`, {
        method: "GET",
        signal: controller.signal,
      })
      const payload = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, payload?.message)
        setError(message)
        toast.error(message)
        return
      }

      setData(normalizeProductoReporteResponse(payload))
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
  }, [enabled, filtro, idSucursal])

  useEffect(() => {
    if (isAuthLoading) return
    void fetchReporte()
  }, [fetchReporte, isAuthLoading])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchReporte()
  }, [fetchReporte])

  return {
    data,
    loading,
    error,
    refresh,
  }
}
