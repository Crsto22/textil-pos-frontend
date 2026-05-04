"use client"

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import type {
  NotaCreditoHistorial,
  NotaCreditoHistorialFilters,
  NotaCreditoHistorialPageResponse,
  NotaCreditoListadoPeriodo,
} from "@/lib/types/nota-credito"

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 400) return "Filtros invalidos para listar notas de credito"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para listar notas de credito"
  if (status === 404) return "No se encontraron notas de credito con esos filtros"
  if (status === 500) return "Error interno del servidor"
  return "Error inesperado al cargar las notas de credito"
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function normalizeNotaCredito(value: unknown): NotaCreditoHistorial | null {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>

  const idNotaCredito = Number(item.idNotaCredito)
  if (!Number.isFinite(idNotaCredito) || idNotaCredito <= 0) return null

  return {
    idNotaCredito,
    fecha: typeof item.fecha === "string" ? item.fecha : "",
    tipoComprobante:
      typeof item.tipoComprobante === "string" ? item.tipoComprobante : "NOTA DE CREDITO",
    serie: typeof item.serie === "string" ? item.serie : "",
    correlativo: Number(item.correlativo) || 0,
    moneda: typeof item.moneda === "string" && item.moneda.trim() ? item.moneda : "PEN",
    total: Number(item.total) || 0,
    estado: typeof item.estado === "string" ? item.estado : "DESCONOCIDO",
    sunatEstado:
      typeof item.sunatEstado === "string" && item.sunatEstado.trim()
        ? item.sunatEstado
        : null,
    sunatBajaEstado: normalizeNullableString(item.sunatBajaEstado),
    sunatBajaCodigo: normalizeNullableString(item.sunatBajaCodigo),
    sunatBajaMensaje: normalizeNullableString(item.sunatBajaMensaje),
    sunatBajaTicket: normalizeNullableString(item.sunatBajaTicket),
    sunatBajaLoteId: Number.isFinite(Number(item.sunatBajaLoteId))
      ? Number(item.sunatBajaLoteId)
      : null,
    sunatBajaMotivo: normalizeNullableString(item.sunatBajaMotivo),
    sunatBajaSolicitadaAt: normalizeNullableString(item.sunatBajaSolicitadaAt),
    sunatBajaRespondidaAt: normalizeNullableString(item.sunatBajaRespondidaAt),
    codigoMotivo:
      typeof item.codigoMotivo === "string" && item.codigoMotivo.trim()
        ? item.codigoMotivo
        : "07",
    descripcionMotivo:
      typeof item.descripcionMotivo === "string"
        ? item.descripcionMotivo
        : "Sin descripcion",
    stockDevuelto: item.stockDevuelto === true,
    idVentaReferencia: Number.isFinite(Number(item.idVentaReferencia))
      ? Number(item.idVentaReferencia)
      : null,
    numeroVentaReferencia:
      typeof item.numeroVentaReferencia === "string"
        ? item.numeroVentaReferencia
        : "Sin referencia",
    tipoComprobanteVentaReferencia:
      typeof item.tipoComprobanteVentaReferencia === "string"
        ? item.tipoComprobanteVentaReferencia
        : "Sin referencia",
    idCliente: Number.isFinite(Number(item.idCliente)) ? Number(item.idCliente) : null,
    nombreCliente: typeof item.nombreCliente === "string" ? item.nombreCliente : "Sin cliente",
    idUsuario: Number.isFinite(Number(item.idUsuario)) ? Number(item.idUsuario) : null,
    nombreUsuario: typeof item.nombreUsuario === "string" ? item.nombreUsuario : "Sin usuario",
    idSucursal: Number.isFinite(Number(item.idSucursal)) ? Number(item.idSucursal) : null,
    nombreSucursal:
      typeof item.nombreSucursal === "string" ? item.nombreSucursal : "Sin sucursal",
    items: Number(item.items) || 0,
  }
}

function resolvePeriodo(filters: NotaCreditoHistorialFilters): NotaCreditoListadoPeriodo {
  return filters.usarRangoFechas ? "RANGO" : filters.periodo
}

function validateFilters(filters: NotaCreditoHistorialFilters): string | null {
  const periodo = resolvePeriodo(filters)

  if (periodo === "FECHA" && !filters.fecha) {
    return "Selecciona una fecha para filtrar"
  }

  if (periodo === "RANGO") {
    if (!filters.fechaDesde || !filters.fechaHasta) {
      return "Selecciona fecha desde y hasta para filtrar por rango"
    }
    if (filters.fechaDesde > filters.fechaHasta) {
      return "La fecha desde no puede ser mayor a la fecha hasta"
    }
  }

  return null
}

function buildQueryParams(
  pageNumber: number,
  filters: NotaCreditoHistorialFilters,
  debouncedSearch: string
): URLSearchParams {
  const params = new URLSearchParams({
    page: String(pageNumber),
    periodo: resolvePeriodo(filters),
  })

  const normalizedSearch = debouncedSearch.trim()
  if (normalizedSearch.length > 0) {
    params.set("q", normalizedSearch)
  }

  if (typeof filters.idVenta === "number" && filters.idVenta > 0) {
    params.set("idVenta", String(filters.idVenta))
  }

  if (typeof filters.idUsuario === "number" && filters.idUsuario > 0) {
    params.set("idUsuario", String(filters.idUsuario))
  }

  if (typeof filters.idCliente === "number" && filters.idCliente > 0) {
    params.set("idCliente", String(filters.idCliente))
  }

  if (typeof filters.idSucursal === "number" && filters.idSucursal > 0) {
    params.set("idSucursal", String(filters.idSucursal))
  }

  if (filters.codigoMotivo !== "TODOS") {
    params.set("codigoMotivo", filters.codigoMotivo)
  }

  if (!filters.usarRangoFechas && filters.periodo === "FECHA") {
    params.set("fecha", filters.fecha)
  }

  if (filters.usarRangoFechas) {
    params.set("desde", filters.fechaDesde)
    params.set("hasta", filters.fechaHasta)
  }

  return params
}

export function useNotasCreditoHistorial(filters: NotaCreditoHistorialFilters) {
  const { isLoading: isAuthLoading } = useAuth()

  const [notasCredito, setNotasCredito] = useState<NotaCreditoHistorial[]>([])
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [numberOfElements, setNumberOfElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const listAbortRef = useRef<AbortController | null>(null)

  const resetPageForDebouncedSearch = useCallback(() => {
    setPage(0)
  }, [])

  const debouncedSearch = useDebouncedValue(
    filters.search,
    SEARCH_DEBOUNCE_MS,
    resetPageForDebouncedSearch
  )

  useEffect(() => {
    setPage(0)
  }, [
    filters.codigoMotivo,
    filters.fecha,
    filters.fechaDesde,
    filters.fechaHasta,
    filters.idCliente,
    filters.idSucursal,
    filters.idUsuario,
    filters.idVenta,
    filters.periodo,
    filters.usarRangoFechas,
  ])

  const fetchNotasCredito = useCallback(async (pageNumber: number) => {
    listAbortRef.current?.abort()
    const controller = new AbortController()
    listAbortRef.current = controller

    setLoading(true)
    setError(null)

    const validationError = validateFilters(filters)
    if (validationError) {
      setLoading(false)
      setError(validationError)
      setNotasCredito([])
      setTotalPages(0)
      setTotalElements(0)
      setNumberOfElements(0)
      return
    }

    try {
      const queryParams = buildQueryParams(pageNumber, filters, debouncedSearch)
      const response = await authFetch(`/api/nota-credito/listar?${queryParams.toString()}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        setNotasCredito([])
        setTotalPages(0)
        setTotalElements(0)
        setNumberOfElements(0)
        toast.error(message)
        return
      }

      const pageData = data as NotaCreditoHistorialPageResponse | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const normalizedContent = content
        .map((item) => normalizeNotaCredito(item))
        .filter((item): item is NotaCreditoHistorial => item !== null)

      setNotasCredito(normalizedContent)
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
      setNotasCredito([])
      setTotalPages(0)
      setTotalElements(0)
      setNumberOfElements(0)
      toast.error(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [debouncedSearch, filters])

  useEffect(() => {
    if (isAuthLoading) return
    void fetchNotasCredito(page)
  }, [fetchNotasCredito, isAuthLoading, page])

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort()
    }
  }, [])

  const refreshNotasCredito = useCallback(async () => {
    await fetchNotasCredito(page)
  }, [fetchNotasCredito, page])

  const setDisplayedPage = useCallback<Dispatch<SetStateAction<number>>>((value) => {
    setPage((previous) => {
      const next = typeof value === "function" ? value(previous) : value
      if (!Number.isFinite(next)) return previous
      if (next < 0) return 0
      return totalPages > 0 ? Math.min(next, totalPages - 1) : 0
    })
  }, [totalPages])

  return {
    notasCredito,
    page,
    size,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setPage,
    setDisplayedPage,
    fetchNotasCredito,
    refreshNotasCredito,
  }
}
