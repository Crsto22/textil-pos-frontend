"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  UsuarioReporteAnulacionItem,
  UsuarioReporteEvolucionItem,
  UsuarioReporteEvolucionPunto,
  UsuarioReporteFilters,
  UsuarioReporteFiltro,
  UsuarioReporteKpiUsuarioItem,
  UsuarioReporteResponse,
} from "@/lib/types/usuario-reporte"

const DEFAULT_FILTRO: UsuarioReporteFiltro = "ULT_30_DIAS"

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

function normalizeFiltro(value: unknown): UsuarioReporteFiltro {
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

function normalizeKpiUsuarioItem(value: unknown): UsuarioReporteKpiUsuarioItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idUsuario: toNullableNumber(payload.idUsuario),
    usuario: toStringValue(payload.usuario, "Usuario"),
    rol: toNullableString(payload.rol),
    ventas: toFiniteNumber(payload.ventas),
    monto: toFiniteNumber(payload.monto),
    ticketPromedio: toFiniteNumber(payload.ticketPromedio),
  }
}

function normalizeAnulacionItem(value: unknown): UsuarioReporteAnulacionItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idUsuario: toNullableNumber(payload.idUsuario),
    usuario: toStringValue(payload.usuario, "Usuario"),
    rol: toNullableString(payload.rol),
    anulaciones: toFiniteNumber(payload.anulaciones),
    montoAnulado: toFiniteNumber(payload.montoAnulado),
  }
}

function normalizePunto(value: unknown): UsuarioReporteEvolucionPunto | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    fecha: toStringValue(payload.fecha),
    ventas: toFiniteNumber(payload.ventas),
    monto: toFiniteNumber(payload.monto),
    anulaciones: toFiniteNumber(payload.anulaciones),
    montoAnulado: toFiniteNumber(payload.montoAnulado),
  }
}

function normalizeEvolucionItem(value: unknown): UsuarioReporteEvolucionItem | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>

  return {
    idUsuario: toNullableNumber(payload.idUsuario),
    usuario: toStringValue(payload.usuario, "Usuario"),
    rol: toNullableString(payload.rol),
    puntos: normalizeList(payload.puntos, normalizePunto),
  }
}

function normalizeList<T>(
  value: unknown,
  mapper: (item: unknown) => T | null
): T[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => mapper(item)).filter((item): item is T => item !== null)
}

function normalizeUsuarioReporteResponse(payload: unknown): UsuarioReporteResponse {
  const data = payload as Record<string, unknown> | null

  return {
    filtro: normalizeFiltro(data?.filtro),
    desde: toStringValue(data?.desde),
    hasta: toStringValue(data?.hasta),
    idSucursal: toNullableNumber(data?.idSucursal),
    nombreSucursal: toNullableString(data?.nombreSucursal),
    kpisPorUsuario: normalizeList(data?.kpisPorUsuario, normalizeKpiUsuarioItem),
    rankingPorMonto: normalizeList(data?.rankingPorMonto, normalizeKpiUsuarioItem),
    rankingPorComprobantes: normalizeList(
      data?.rankingPorComprobantes,
      normalizeKpiUsuarioItem
    ),
    controlAnulacionesPorUsuario: normalizeList(
      data?.controlAnulacionesPorUsuario,
      normalizeAnulacionItem
    ),
    evolucionDiariaPorUsuario: normalizeList(
      data?.evolucionDiariaPorUsuario,
      normalizeEvolucionItem
    ),
  }
}

function buildQueryString(filters: UsuarioReporteFilters): string {
  const searchParams = new URLSearchParams()
  searchParams.set("filtro", filters.filtro)

  if (typeof filters.idSucursal === "number" && filters.idSucursal > 0) {
    searchParams.set("idSucursal", String(filters.idSucursal))
  }

  return searchParams.toString()
}

function getErrorMessage(status: number, backendMessage?: string): string {
  if (backendMessage) return backendMessage
  if (status === 400) return "Filtros invalidos para generar el reporte de usuarios"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para consultar este reporte"
  if (status === 404) return "No se encontraron datos para el reporte de usuarios"
  if (status === 500) return "Error interno del servidor"
  return "No se pudo cargar el reporte de usuarios"
}

export function useUsuarioReporte(filters: UsuarioReporteFilters, enabled = true) {
  const { isLoading: isAuthLoading } = useAuth()
  const [data, setData] = useState<UsuarioReporteResponse | null>(null)
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
      const response = await authFetch(`/api/usuario/reporte?${queryString}`, {
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

      setData(normalizeUsuarioReporteResponse(payload))
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
