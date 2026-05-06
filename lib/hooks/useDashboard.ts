"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  DashboardAdminData,
  DashboardAdminKpis,
  DashboardAlmacenData,
  DashboardComprobanteTipoItem,
  DashboardData,
  DashboardEstadoItem,
  DashboardFilters,
  DashboardFiltro,
  DashboardMovimientoItem,
  DashboardPaymentIncome,
  DashboardResumenMovimientos,
  DashboardSalePoint,
  DashboardSistemaData,
  DashboardStockCritico,
  DashboardStockCriticoItem,
  DashboardSucursalVentasItem,
  DashboardTopProduct,
  DashboardVentasData,
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
    value === "TIEMPO_REAL"
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
    etiqueta: toStringValue(payload.etiqueta, toStringValue(payload.fecha)),
    granularidad: toStringValue(payload.granularidad, "DIA"),
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
    stock: toNullableNumber(payload.stockActual ?? payload.stock),
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

function normalizeResumenMovimientos(value: unknown): DashboardResumenMovimientos {
  const payload = value as Record<string, unknown> | null
  return {
    totalMovimientos: toFiniteNumber(payload?.totalMovimientos),
    unidadesEntrada: toFiniteNumber(payload?.unidadesEntrada),
    unidadesSalida: toFiniteNumber(payload?.unidadesSalida),
    unidadesAjuste: toFiniteNumber(payload?.unidadesAjuste),
    unidadesReserva: toFiniteNumber(payload?.unidadesReserva),
    unidadesLiberacion: toFiniteNumber(payload?.unidadesLiberacion),
    trasladosEntrada: toFiniteNumber(payload?.trasladosEntrada),
    unidadesTrasladoEntrada: toFiniteNumber(payload?.unidadesTrasladoEntrada),
    trasladosSalida: toFiniteNumber(payload?.trasladosSalida),
    unidadesTrasladoSalida: toFiniteNumber(payload?.unidadesTrasladoSalida),
  }
}

function normalizeMovimientoItem(value: unknown): DashboardMovimientoItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>
  return {
    fecha: toStringValue(payload.fecha),
    tipo: toStringValue(payload.tipoMovimiento ?? payload.tipo, "ENTRADA"),
    motivo: toNullableString(payload.motivo),
    producto: toStringValue(payload.producto, "Producto"),
    color: toNullableString(payload.color),
    talla: toNullableString(payload.talla),
    cantidad: toFiniteNumber(payload.cantidad),
    stockAntes: toFiniteNumber(payload.stockAnterior ?? payload.stockAntes),
    stockDespues: toFiniteNumber(payload.stockNuevo ?? payload.stockDespues),
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
    resumenMovimientos: normalizeResumenMovimientos(data?.resumenMovimientos),
    ultimosMovimientos: normalizeList(data?.ultimosMovimientos, normalizeMovimientoItem),
    topStockActual: normalizeList(data?.topStockActual, normalizeTopProduct),
  }
}

function normalizeSistemaDashboard(data: Record<string, unknown> | null): DashboardSistemaData {
  const storage = data?.storage as Record<string, unknown> | null
  const database = data?.database as Record<string, unknown> | null
  const runtime = data?.runtime as Record<string, unknown> | null
  const disk = data?.disk as Record<string, unknown> | null
  const sunat = data?.sunat as Record<string, unknown> | null
  const usuarios = data?.usuarios as Record<string, unknown> | null

  const carpetas = Array.isArray(storage?.carpetas)
    ? (storage!.carpetas as Record<string, unknown>[]).map((c) => ({
        carpeta: toStringValue(c.carpeta),
        existe: Boolean(c.existe),
        bytes: toFiniteNumber(c.bytes),
        bytesLegible: toStringValue(c.bytesLegible),
        archivos: toFiniteNumber(c.archivos),
      }))
    : []

  const tablasMasPesadas = Array.isArray(database?.tablasMasPesadas)
    ? (database!.tablasMasPesadas as Record<string, unknown>[]).map((t) => ({
        tableName: toStringValue(t.tableName),
        sizeMb: toFiniteNumber(t.sizeMb),
        rows: toFiniteNumber(t.rows),
      }))
    : []

  const jobsPorEstado = Array.isArray(sunat?.jobsPorEstado)
    ? (sunat!.jobsPorEstado as Record<string, unknown>[]).map((j) => ({
        estado: toStringValue(j.estado),
        total: toFiniteNumber(j.total),
      }))
    : []

  const ultimoJobRaw = sunat?.ultimoJob as Record<string, unknown> | null
  const ultimoJob = ultimoJobRaw
    ? {
        idSunatJob: toFiniteNumber(ultimoJobRaw.idSunatJob),
        estado: toStringValue(ultimoJobRaw.estado),
        tipoDocumento: toStringValue(ultimoJobRaw.tipoDocumento),
        fechaCreacion: toStringValue(ultimoJobRaw.fechaCreacion),
        fechaActualizacion: toStringValue(ultimoJobRaw.fechaActualizacion),
      }
    : null

  const servicioRaw = sunat?.servicio as Record<string, unknown> | null
  const servicio = servicioRaw
    ? {
        estado: toStringValue(servicioRaw.estado),
        disponible: Boolean(servicioRaw.disponible),
        ambiente: toStringValue(servicioRaw.ambiente),
        endpoint: toStringValue(servicioRaw.endpoint),
        httpStatus: toFiniteNumber(servicioRaw.httpStatus),
        latenciaMs: toFiniteNumber(servicioRaw.latenciaMs),
        mensaje: toStringValue(servicioRaw.mensaje),
        verificadoEn: toStringValue(servicioRaw.verificadoEn),
      }
    : null

  const activosPorRol = Array.isArray(usuarios?.activosPorRol)
    ? (usuarios!.activosPorRol as Record<string, unknown>[]).map((r) => ({
        rol: toStringValue(r.rol),
        total: toFiniteNumber(r.total),
      }))
    : []

  const alertas = Array.isArray(data?.alertas)
    ? (data!.alertas as Record<string, unknown>[]).map((a) => ({
        componente: toStringValue(a.componente),
        estado: toStringValue(a.estado),
        mensaje: toStringValue(a.mensaje),
      }))
    : []

  return {
    dashboard: "SISTEMA",
    generadoEn: toStringValue(data?.generadoEn),
    storage: {
      basePath: toStringValue(storage?.basePath),
      existe: Boolean(storage?.existe),
      totalBytes: toFiniteNumber(storage?.totalBytes),
      totalLegible: toStringValue(storage?.totalLegible),
      totalArchivos: toFiniteNumber(storage?.totalArchivos),
      carpetas,
    },
    database: {
      sizeMb: toFiniteNumber(database?.sizeMb),
      tablesCount: toFiniteNumber(database?.tablesCount),
      tablasMasPesadas,
    },
    runtime: {
      applicationName: toStringValue(runtime?.applicationName),
      javaVersion: toStringValue(runtime?.javaVersion),
      uptimeMs: toFiniteNumber(runtime?.uptimeMs),
      uptimeLegible: toStringValue(runtime?.uptimeLegible),
      processors: toFiniteNumber(runtime?.processors),
      memoryUsedBytes: toFiniteNumber(runtime?.memoryUsedBytes),
      memoryUsedLegible: toStringValue(runtime?.memoryUsedLegible),
      memoryFreeBytes: toFiniteNumber(runtime?.memoryFreeBytes),
      memoryFreeLegible: toStringValue(runtime?.memoryFreeLegible),
      memoryMaxBytes: toFiniteNumber(runtime?.memoryMaxBytes),
      memoryMaxLegible: toStringValue(runtime?.memoryMaxLegible),
      memoryUsedPercent: toFiniteNumber(runtime?.memoryUsedPercent),
    },
    disk: {
      path: toStringValue(disk?.path),
      totalBytes: toFiniteNumber(disk?.totalBytes),
      totalLegible: toStringValue(disk?.totalLegible),
      usedBytes: toFiniteNumber(disk?.usedBytes),
      usedLegible: toStringValue(disk?.usedLegible),
      freeBytes: toFiniteNumber(disk?.freeBytes),
      freeLegible: toStringValue(disk?.freeLegible),
      freePercent: toFiniteNumber(disk?.freePercent),
    },
    sunat: {
      totalJobs: toFiniteNumber(sunat?.totalJobs),
      jobsNoFinalizados: toFiniteNumber(sunat?.jobsNoFinalizados),
      jobsPorEstado,
      ultimoJob,
      servicio,
    },
    usuarios: {
      activos: toFiniteNumber(usuarios?.activos),
      eliminados: toFiniteNumber(usuarios?.eliminados),
      activosPorRol,
    },
    alertas,
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

  if (dashboard === "SISTEMA") {
    return normalizeSistemaDashboard(data)
  }

  return normalizeVentasDashboard(data)
}

function buildQueryString(filters: DashboardFilters): string {
  const searchParams = new URLSearchParams()
  if (filters.desde) {
    searchParams.set("desde", filters.desde)
  }

  if (filters.hasta) {
    searchParams.set("hasta", filters.hasta)
  }

  if (!filters.desde && !filters.hasta && filters.filtro) {
    searchParams.set("filtro", filters.filtro)
  }

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
  const { filtro, desde, hasta, idSucursal } = filters

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

    if (desde && hasta && desde > hasta) {
      const message = "La fecha desde no puede ser mayor a la fecha hasta"
      setLoading(false)
      setError(message)
      setData(null)
      return
    }

    try {
      const queryString = buildQueryString({ filtro, desde, hasta, idSucursal })
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
  }, [enabled, filtro, desde, hasta, idSucursal])

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
