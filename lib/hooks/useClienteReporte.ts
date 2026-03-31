"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  ClienteReporteCohorteItem,
  ClienteReporteFilters,
  ClienteReporteFiltro,
  ClienteReporteKpis,
  ClienteReporteResponse,
  ClienteReporteRfmItem,
  ClienteReporteTopCliente,
} from "@/lib/types/cliente-reporte"

const DEFAULT_FILTRO: ClienteReporteFiltro = "ULT_30_DIAS"

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

function normalizeFiltro(value: unknown): ClienteReporteFiltro {
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

function normalizeKpis(value: unknown): ClienteReporteKpis {
  const payload = value as Record<string, unknown> | null
  return {
    clientesActivos: toFiniteNumber(payload?.clientesActivos),
    clientesNuevosMes: toFiniteNumber(payload?.clientesNuevosMes),
    recurrenciaPct: toFiniteNumber(payload?.recurrenciaPct),
  }
}

function normalizeTopCliente(value: unknown): ClienteReporteTopCliente | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idCliente: toNullableNumber(payload.idCliente),
    cliente: toStringValue(payload.cliente, "Cliente sin nombre"),
    tipoDocumento: toNullableString(payload.tipoDocumento),
    nroDocumento: toNullableString(payload.nroDocumento),
    compras: toFiniteNumber(payload.compras),
    totalGastado: toFiniteNumber(payload.totalGastado),
    ticketPromedio: toFiniteNumber(payload.ticketPromedio),
    ultimaCompra: toNullableString(payload.ultimaCompra),
  }
}

function normalizeCohorteItem(value: unknown): ClienteReporteCohorteItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    cohorteSemana: toStringValue(payload.cohorteSemana, "Sin cohorte"),
    inicioSemana: toStringValue(payload.inicioSemana),
    clientesNuevos: toFiniteNumber(payload.clientesNuevos),
    clientesQueRecompran: toFiniteNumber(payload.clientesQueRecompran),
    tasaRecompraPct: toFiniteNumber(payload.tasaRecompraPct),
  }
}

function normalizeRfmItem(value: unknown): ClienteReporteRfmItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idCliente: toNullableNumber(payload.idCliente),
    cliente: toStringValue(payload.cliente, "Cliente"),
    tipoDocumento: toNullableString(payload.tipoDocumento),
    nroDocumento: toNullableString(payload.nroDocumento),
    ultimaCompra: toNullableString(payload.ultimaCompra),
    recenciaDias: toFiniteNumber(payload.recenciaDias),
    frecuencia: toFiniteNumber(payload.frecuencia),
    monto: toFiniteNumber(payload.monto),
  }
}

function normalizeList<T>(
  value: unknown,
  mapper: (item: unknown) => T | null
): T[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => mapper(item)).filter((item): item is T => item !== null)
}

function normalizeClienteReporteResponse(payload: unknown): ClienteReporteResponse {
  const data = payload as Record<string, unknown> | null

  return {
    filtro: normalizeFiltro(data?.filtro),
    desde: toStringValue(data?.desde),
    hasta: toStringValue(data?.hasta),
    idSucursal: toNullableNumber(data?.idSucursal),
    nombreSucursal: toNullableString(data?.nombreSucursal),
    kpis: normalizeKpis(data?.kpis),
    topClientesPorMonto: normalizeList(data?.topClientesPorMonto, normalizeTopCliente),
    topClientesPorCompras: normalizeList(
      data?.topClientesPorCompras,
      normalizeTopCliente
    ),
    cohorteSemanal: normalizeList(data?.cohorteSemanal, normalizeCohorteItem),
    segmentacionRfm: normalizeList(data?.segmentacionRfm, normalizeRfmItem),
  }
}

function buildQueryString(filters: ClienteReporteFilters): string {
  const searchParams = new URLSearchParams()
  searchParams.set("filtro", filters.filtro)

  if (typeof filters.idSucursal === "number" && filters.idSucursal > 0) {
    searchParams.set("idSucursal", String(filters.idSucursal))
  }

  return searchParams.toString()
}

function getErrorMessage(status: number, backendMessage?: string): string {
  if (backendMessage) return backendMessage
  if (status === 400) return "Filtros invalidos para generar el reporte de clientes"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para consultar este reporte"
  if (status === 404) return "No se encontraron datos para el reporte de clientes"
  if (status === 500) return "Error interno del servidor"
  return "No se pudo cargar el reporte de clientes"
}

export function useClienteReporte(filters: ClienteReporteFilters, enabled = true) {
  const { isLoading: isAuthLoading } = useAuth()
  const [data, setData] = useState<ClienteReporteResponse | null>(null)
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
      const response = await authFetch(`/api/cliente/reporte?${queryString}`, {
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

      setData(normalizeClienteReporteResponse(payload))
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
