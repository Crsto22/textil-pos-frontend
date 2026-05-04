"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  VentaResumenEstadoItem,
  VentaResumenMontoPorDiaItem,
  VentaResumenReporteFilters,
  VentaResumenReporteFiltro,
  VentaResumenReporteKpis,
  VentaResumenReporteResponse,
  VentaResumenSucursalItem,
  VentaResumenTipoComprobanteItem,
} from "@/lib/types/venta-resumen-reporte"

const DEFAULT_FILTRO: VentaResumenReporteFiltro = "ULT_30_DIAS"

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

function normalizeFiltro(value: unknown): VentaResumenReporteFiltro {
  if (
    value === "HOY" ||
    value === "ULT_7_DIAS" ||
    value === "ULT_14_DIAS" ||
    value === "ULT_30_DIAS"
  ) {
    return value
  }
  return DEFAULT_FILTRO
}

function normalizeKpis(value: unknown): VentaResumenReporteKpis {
  const payload = value as Record<string, unknown> | null
  return {
    ventasDelDia: toFiniteNumber(payload?.ventasDelDia),
    ventasDelMes: toFiniteNumber(payload?.ventasDelMes),
    ticketPromedio: toFiniteNumber(payload?.ticketPromedio),
    cantidadComprobantes: toFiniteNumber(payload?.cantidadComprobantes),
  }
}

function normalizeMontoPorDiaItem(value: unknown): VentaResumenMontoPorDiaItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    fecha: toStringValue(payload.fecha),
    monto: toFiniteNumber(payload.monto),
  }
}

function normalizeTipoComprobanteItem(
  value: unknown
): VentaResumenTipoComprobanteItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    tipoComprobante: toStringValue(payload.tipoComprobante, "Sin tipo"),
    cantidadComprobantes: toFiniteNumber(payload.cantidadComprobantes),
    montoVendido: toFiniteNumber(payload.montoVendido),
  }
}

function normalizeEstadoItem(value: unknown): VentaResumenEstadoItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    estado: toStringValue(payload.estado, "Sin estado"),
    cantidadComprobantes: toFiniteNumber(payload.cantidadComprobantes),
    montoTotal: toFiniteNumber(payload.montoTotal),
  }
}

function normalizeSucursalItem(value: unknown): VentaResumenSucursalItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idSucursal: toNullableNumber(payload.idSucursal),
    sucursal: toStringValue(payload.sucursal, "Sin sucursal"),
    cantidadComprobantes: toFiniteNumber(payload.cantidadComprobantes),
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

function normalizeVentaResumenReporteResponse(
  payload: unknown
): VentaResumenReporteResponse {
  const data = payload as Record<string, unknown> | null

  return {
    filtro: normalizeFiltro(data?.filtro),
    desde: toStringValue(data?.desde),
    hasta: toStringValue(data?.hasta),
    idSucursal: toNullableNumber(data?.idSucursal),
    nombreSucursal: toNullableString(data?.nombreSucursal),
    kpis: normalizeKpis(data?.kpis),
    tendenciaMontoPorDia: normalizeList(
      data?.tendenciaMontoPorDia,
      normalizeMontoPorDiaItem
    ),
    ventasPorTipoComprobante: normalizeList(
      data?.ventasPorTipoComprobante,
      normalizeTipoComprobanteItem
    ),
    distribucionPorEstado: normalizeList(
      data?.distribucionPorEstado,
      normalizeEstadoItem
    ),
    ventasPorSucursal: normalizeList(data?.ventasPorSucursal, normalizeSucursalItem),
  }
}

function buildQueryString(filters: VentaResumenReporteFilters): string {
  const searchParams = new URLSearchParams()
  searchParams.set("filtro", filters.filtro)

  if (typeof filters.idSucursal === "number" && filters.idSucursal > 0) {
    searchParams.set("idSucursal", String(filters.idSucursal))
  }

  return searchParams.toString()
}

function getErrorMessage(status: number, backendMessage?: string): string {
  if (backendMessage) return backendMessage
  if (status === 400) return "Filtros invalidos para generar el resumen de ventas"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para consultar este reporte"
  if (status === 404) return "No se encontraron datos para el resumen de ventas"
  if (status === 500) return "Error interno del servidor"
  return "No se pudo cargar el resumen de ventas"
}

export function useVentaResumenReporte(
  filters: VentaResumenReporteFilters,
  enabled = true
) {
  const { isLoading: isAuthLoading } = useAuth()
  const [data, setData] = useState<VentaResumenReporteResponse | null>(null)
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
      const response = await authFetch(`/api/venta/reporte/resumen?${queryString}`, {
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

      setData(normalizeVentaResumenReporteResponse(payload))
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
