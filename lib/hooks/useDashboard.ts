"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  DashboardAdminData,
  DashboardAdminKpis,
  DashboardComprobanteTipoItem,
  DashboardData,
  DashboardEstadoItem,
  DashboardFilters,
  DashboardFiltro,
  DashboardPaymentIncome,
  DashboardSalePoint,
  DashboardStockCritico,
  DashboardStockCriticoItem,
  DashboardSucursalVentasItem,
  DashboardTopProduct,
  DashboardVentasData,
  DashboardAlmacenData,
} from "@/lib/types/dashboard"

const DEFAULT_FILTRO: DashboardFiltro = "HOY"

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

function normalizeFiltro(value: unknown): DashboardFiltro {
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

function normalizeSalePoint(value: unknown): DashboardSalePoint | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    fecha: toStringValue(payload.fecha),
    monto: toFiniteNumber(payload.monto),
  }
}

function normalizePaymentIncome(value: unknown): DashboardPaymentIncome | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    metodoPago: toStringValue(payload.metodoPago, "Sin metodo"),
    monto: toFiniteNumber(payload.monto),
  }
}

function normalizeTopProduct(value: unknown): DashboardTopProduct | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idProductoVariante: toNullableNumber(payload.idProductoVariante),
    producto: toStringValue(payload.producto, "Producto"),
    color: toNullableString(payload.color),
    talla: toNullableString(payload.talla),
    cantidadVendida: toFiniteNumber(payload.cantidadVendida),
    stock: toNullableNumber(payload.stock),
    sku: toNullableString(payload.sku),
  }
}

function normalizeComprobanteTipoItem(
  value: unknown
): DashboardComprobanteTipoItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    tipoComprobante: toStringValue(payload.tipoComprobante, "Sin tipo"),
    cantidadComprobantes: toFiniteNumber(payload.cantidadComprobantes),
    montoVendido: toFiniteNumber(payload.montoVendido),
  }
}

function normalizeEstadoItem(value: unknown): DashboardEstadoItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    estado: toStringValue(payload.estado, "Sin estado"),
    cantidadComprobantes: toFiniteNumber(payload.cantidadComprobantes),
    montoTotal: toFiniteNumber(payload.montoTotal),
  }
}

function normalizeSucursalVentasItem(
  value: unknown
): DashboardSucursalVentasItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idSucursal: toNullableNumber(payload.idSucursal),
    sucursal: toStringValue(payload.sucursal, "Sucursal"),
    cantidadComprobantes: toFiniteNumber(payload.cantidadComprobantes),
    montoVendido: toFiniteNumber(payload.montoVendido),
  }
}

function normalizeStockCriticoItem(value: unknown): DashboardStockCriticoItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idProductoVariante: toNullableNumber(payload.idProductoVariante),
    producto: toStringValue(payload.producto, "Producto"),
    color: toNullableString(payload.color),
    talla: toNullableString(payload.talla),
    stock: toFiniteNumber(payload.stock),
    sku: toNullableString(payload.sku),
  }
}

function normalizeList<T>(
  value: unknown,
  mapper: (item: unknown) => T | null
): T[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => mapper(item)).filter((item): item is T => item !== null)
}

function normalizeStockCritico(value: unknown): DashboardStockCritico {
  const payload = value as Record<string, unknown> | null

  return {
    variantesAgotadas: toFiniteNumber(payload?.variantesAgotadas),
    stockBajo: toFiniteNumber(payload?.stockBajo),
    agotados: normalizeList(payload?.agotados, normalizeStockCriticoItem),
    prontosAgotarse: normalizeList(
      payload?.prontosAgotarse,
      normalizeStockCriticoItem
    ),
  }
}

function normalizeAdminKpis(value: unknown): DashboardAdminKpis {
  const payload = value as Record<string, unknown> | null

  return {
    ventasTotalesFiltro: toFiniteNumber(
      payload?.ventasTotalesFiltro,
      toFiniteNumber(payload?.ventasDelDia)
    ),
    ventasDelDia: toFiniteNumber(payload?.ventasDelDia),
    ventasDelMes: toFiniteNumber(payload?.ventasDelMes),
    ticketPromedio: toFiniteNumber(payload?.ticketPromedio),
    comprobantesEmitidos: toFiniteNumber(payload?.comprobantesEmitidos),
    comprobantesAnulados: toFiniteNumber(payload?.comprobantesAnulados),
    montoAnulado: toFiniteNumber(payload?.montoAnulado),
    unidadesVendidas: toFiniteNumber(payload?.unidadesVendidas),
    variantesVendidas: toFiniteNumber(payload?.variantesVendidas),
  }
}

function normalizeBaseFields(data: Record<string, unknown> | null) {
  return {
    filtro: normalizeFiltro(data?.filtro),
    idSucursal: toNullableNumber(data?.idSucursal),
    nombreSucursal: toNullableString(data?.nombreSucursal),
    desde: toStringValue(data?.desde),
    hasta: toStringValue(data?.hasta),
  }
}

function normalizeAdminDashboard(data: Record<string, unknown> | null): DashboardAdminData {
  const base = normalizeBaseFields(data)

  return {
    dashboard: "ADMIN",
    ...base,
    ventasTotales: toFiniteNumber(data?.ventasTotales),
    productosVendidos: toFiniteNumber(data?.productosVendidos),
    ticketsEmitidos: toFiniteNumber(data?.ticketsEmitidos),
    kpis: normalizeAdminKpis(data?.kpis),
    ingresosPorMetodoPago: normalizeList(
      data?.ingresosPorMetodoPago,
      normalizePaymentIncome
    ),
    ventasPorFecha: normalizeList(data?.ventasPorFecha, normalizeSalePoint),
    topProductosMasVendidos: normalizeList(
      data?.topProductosMasVendidos,
      normalizeTopProduct
    ),
    comprobantesPorTipo: normalizeList(
      data?.comprobantesPorTipo,
      normalizeComprobanteTipoItem
    ),
    distribucionPorEstado: normalizeList(
      data?.distribucionPorEstado,
      normalizeEstadoItem
    ),
    ventasPorSucursal: normalizeList(data?.ventasPorSucursal, normalizeSucursalVentasItem),
    stockCritico: normalizeStockCritico(data?.stockCritico),
  }
}

function normalizeVentasDashboard(data: Record<string, unknown> | null): DashboardVentasData {
  const base = normalizeBaseFields(data)

  return {
    dashboard: "VENTAS",
    ...base,
    misVentasTotales: toFiniteNumber(data?.misVentasTotales),
    misProductosVendidos: toFiniteNumber(data?.misProductosVendidos),
    miPromedioVenta: toFiniteNumber(data?.miPromedioVenta),
    misCotizacionesAbiertas: toFiniteNumber(data?.misCotizacionesAbiertas),
    misVentasPorFecha: normalizeList(data?.misVentasPorFecha, normalizeSalePoint),
    topProductosMasVendidos: normalizeList(
      data?.topProductosMasVendidos,
      normalizeTopProduct
    ),
  }
}

function normalizeAlmacenDashboard(data: Record<string, unknown> | null): DashboardAlmacenData {
  const base = normalizeBaseFields(data)

  return {
    dashboard: "ALMACEN",
    ...base,
    totalFisicoEnTienda: toFiniteNumber(data?.totalFisicoEnTienda),
    variantesDisponibles: toFiniteNumber(data?.variantesDisponibles),
    variantesAgotadas: toFiniteNumber(data?.variantesAgotadas),
    stockBajo: toFiniteNumber(data?.stockBajo),
    reposicionUrgente: normalizeList(data?.reposicionUrgente, normalizeStockCriticoItem),
    topMayorSalida: normalizeList(data?.topMayorSalida, normalizeTopProduct),
  }
}

function normalizeDashboardResponse(payload: unknown): DashboardData {
  const data = payload as Record<string, unknown> | null
  const dashboard = toStringValue(data?.dashboard, "VENTAS")

  if (dashboard === "ADMIN") {
    return normalizeAdminDashboard(data)
  }

  if (dashboard === "ALMACEN") {
    return normalizeAlmacenDashboard(data)
  }

  return normalizeVentasDashboard(data)
}

function buildQueryString(filters: DashboardFilters): string {
  const searchParams = new URLSearchParams()
  searchParams.set("filtro", filters.filtro)

  if (typeof filters.idSucursal === "number" && filters.idSucursal > 0) {
    searchParams.set("idSucursal", String(filters.idSucursal))
  }

  return searchParams.toString()
}

function getErrorMessage(status: number, backendMessage?: string): string {
  if (backendMessage) return backendMessage
  if (status === 400) return "Filtros invalidos para cargar el dashboard"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para consultar este dashboard"
  if (status === 404) return "No se encontraron datos para el dashboard"
  if (status === 500) return "Error interno del servidor"
  return "No se pudo cargar el dashboard"
}

export function useDashboard(filters: DashboardFilters, enabled = true) {
  const { isLoading: isAuthLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { filtro, idSucursal } = filters

  const fetchDashboard = useCallback(async () => {
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
      const response = await authFetch(`/api/dashboard?${queryString}`, {
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

      setData(normalizeDashboardResponse(payload))
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
    void fetchDashboard()
  }, [fetchDashboard, isAuthLoading])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchDashboard()
  }, [fetchDashboard])

  return {
    data,
    loading,
    error,
    refresh,
  }
}
