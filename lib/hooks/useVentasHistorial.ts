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
  VentaHistorial,
  VentaHistorialFilters,
  VentaHistorialPageResponse,
  VentaListadoPeriodo,
} from "@/lib/types/venta"

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 400) return "Filtros invalidos para listar ventas"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para listar ventas"
  if (status === 404) return "No se encontraron datos con esos filtros"
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
      typeof item.tipoComprobante === "string" ? item.tipoComprobante : "NOTA DE VENTA",
    serie: typeof item.serie === "string" ? item.serie : "",
    correlativo: Number(item.correlativo) || 0,
    moneda: typeof item.moneda === "string" && item.moneda.trim() ? item.moneda : "PEN",
    total: Number(item.total) || 0,
    estado: typeof item.estado === "string" ? item.estado : "DESCONOCIDO",
    sunatEstado:
      typeof item.sunatEstado === "string" && item.sunatEstado.trim()
        ? item.sunatEstado
        : null,
    sunatBajaEstado:
      typeof item.sunatBajaEstado === "string" && item.sunatBajaEstado.trim()
        ? item.sunatBajaEstado
        : null,
    idCliente: Number.isFinite(Number(item.idCliente)) ? Number(item.idCliente) : null,
    nombreCliente: typeof item.nombreCliente === "string" ? item.nombreCliente : "Sin cliente",
    idUsuario: Number.isFinite(Number(item.idUsuario)) ? Number(item.idUsuario) : null,
    nombreUsuario: typeof item.nombreUsuario === "string" ? item.nombreUsuario : "Sin usuario",
    idSucursal: Number.isFinite(Number(item.idSucursal)) ? Number(item.idSucursal) : null,
    nombreSucursal: typeof item.nombreSucursal === "string" ? item.nombreSucursal : "Sin sucursal",
    idCanalVenta: Number.isFinite(Number(item.idCanalVenta)) ? Number(item.idCanalVenta) : null,
    nombreCanalVenta: typeof item.nombreCanalVenta === "string" ? item.nombreCanalVenta : null,
    plataformaCanalVenta: typeof item.plataformaCanalVenta === "string" ? item.plataformaCanalVenta : null,
    items: Number(item.items) || 0,
    pagos: Number(item.pagos) || 0,
  }
}

function resolvePeriodo(filters: VentaHistorialFilters): VentaListadoPeriodo {
  return filters.usarRangoFechas ? "RANGO" : filters.periodo
}

function validateFilters(filters: VentaHistorialFilters): string | null {
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
  filters: VentaHistorialFilters,
  debouncedSearch: string,
  lockedTipos?: string[]
): URLSearchParams {
  const params = new URLSearchParams({
    page: String(pageNumber),
    periodo: resolvePeriodo(filters),
  })

  const normalizedSearch = debouncedSearch.trim()
  if (normalizedSearch.length > 0) {
    params.set("q", normalizedSearch)
  }

  if (filters.estado !== "TODOS") {
    params.set("estado", filters.estado)
  }

  if (lockedTipos && lockedTipos.length > 0) {
    // Comprobantes forzados: si el usuario eligió uno específico, solo ese; si "TODOS", todos los locked
    const tipos = filters.comprobante !== "TODOS" ? [filters.comprobante] : lockedTipos
    tipos.forEach((tipo) => params.append("tipoComprobante", tipo))
  } else if (filters.comprobante !== "TODOS") {
    params.set("tipoComprobante", filters.comprobante)
  }

  if (typeof filters.idUsuario === "number" && filters.idUsuario > 0) {
    params.set("idUsuario", String(filters.idUsuario))
  }

  if (typeof filters.idSucursal === "number" && filters.idSucursal > 0) {
    params.set("idSucursal", String(filters.idSucursal))
  }

  if (typeof filters.idCliente === "number" && filters.idCliente > 0) {
    params.set("idCliente", String(filters.idCliente))
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

export function useVentasHistorial(filters: VentaHistorialFilters, lockedTipos?: string[]) {
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
    filters.comprobante,
    filters.estado,
    filters.fecha,
    filters.fechaDesde,
    filters.fechaHasta,
    filters.idCliente,
    filters.idUsuario,
    filters.idSucursal,
    filters.periodo,
    filters.usarRangoFechas,
  ])

  const fetchVentas = useCallback(async (pageNumber: number) => {
    listAbortRef.current?.abort()
    const controller = new AbortController()
    listAbortRef.current = controller

    setLoading(true)
    setError(null)

    const validationError = validateFilters(filters)
    if (validationError) {
      setLoading(false)
      setError(validationError)
      setVentas([])
      setTotalPages(0)
      setTotalElements(0)
      setNumberOfElements(0)
      return
    }

    try {
      const queryParams = buildQueryParams(pageNumber, filters, debouncedSearch, lockedTipos)
      const response = await authFetch(`/api/venta/listar?${queryParams.toString()}`, {
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
  }, [
    debouncedSearch,
    filters,
  ])

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
