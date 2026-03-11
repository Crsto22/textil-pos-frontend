"use client"

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/lib/hooks/useDebouncedValue"
import type {
  CotizacionHistorial,
  CotizacionHistorialFilters,
  CotizacionHistorialPageResponse,
  CotizacionListadoPeriodo,
} from "@/lib/types/cotizacion"

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 400) return "Filtros invalidos para listar cotizaciones"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para listar cotizaciones"
  if (status === 404) return "No se encontraron cotizaciones con esos filtros"
  if (status === 500) return "Error interno del servidor"
  return "Error inesperado al cargar el historial de cotizaciones"
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function normalizeCotizacion(value: unknown): CotizacionHistorial | null {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>

  const idCotizacion = Number(item.idCotizacion)
  if (!Number.isFinite(idCotizacion) || idCotizacion <= 0) return null

  return {
    idCotizacion,
    fecha: typeof item.fecha === "string" ? item.fecha : "",
    fechaVencimiento: typeof item.fechaVencimiento === "string" ? item.fechaVencimiento : "",
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
  }
}

function resolvePeriodo(filters: CotizacionHistorialFilters): CotizacionListadoPeriodo {
  return filters.usarRangoFechas ? "RANGO" : filters.periodo
}

function validateFilters(filters: CotizacionHistorialFilters): string | null {
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
  filters: CotizacionHistorialFilters,
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

  if (filters.estado !== "TODOS") {
    params.set("estado", filters.estado)
  }

  if (typeof filters.idUsuario === "number" && filters.idUsuario > 0) {
    params.set("idUsuario", String(filters.idUsuario))
  }

  if (typeof filters.idSucursal === "number" && filters.idSucursal > 0) {
    params.set("idSucursal", String(filters.idSucursal))
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

export function useCotizacionesHistorial(filters: CotizacionHistorialFilters) {
  const { isLoading: isAuthLoading } = useAuth()

  const [cotizaciones, setCotizaciones] = useState<CotizacionHistorial[]>([])
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
    filters.estado,
    filters.fecha,
    filters.fechaDesde,
    filters.fechaHasta,
    filters.idUsuario,
    filters.idSucursal,
    filters.periodo,
    filters.usarRangoFechas,
  ])

  const fetchCotizaciones = useCallback(async (pageNumber: number) => {
    listAbortRef.current?.abort()
    const controller = new AbortController()
    listAbortRef.current = controller

    setLoading(true)
    setError(null)

    const validationError = validateFilters(filters)
    if (validationError) {
      setLoading(false)
      setError(validationError)
      setCotizaciones([])
      setTotalPages(0)
      setTotalElements(0)
      setNumberOfElements(0)
      return
    }

    try {
      const queryParams = buildQueryParams(pageNumber, filters, debouncedSearch)
      const response = await authFetch(`/api/cotizacion/listar?${queryParams.toString()}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getErrorMessage(response.status, data?.message)
        setError(message)
        setCotizaciones([])
        setTotalPages(0)
        setTotalElements(0)
        setNumberOfElements(0)
        toast.error(message)
        return
      }

      const pageData = data as CotizacionHistorialPageResponse | null
      const content = Array.isArray(pageData?.content) ? pageData.content : []
      const normalizedContent = content
        .map((item) => normalizeCotizacion(item))
        .filter((item): item is CotizacionHistorial => item !== null)

      setCotizaciones(normalizedContent)
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
      setCotizaciones([])
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
    void fetchCotizaciones(page)
  }, [fetchCotizaciones, isAuthLoading, page])

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort()
    }
  }, [])

  const refreshCotizaciones = useCallback(async () => {
    await fetchCotizaciones(page)
  }, [fetchCotizaciones, page])

  const setDisplayedPage = useCallback<Dispatch<SetStateAction<number>>>((value) => {
    setPage((previous) => {
      const next = typeof value === "function" ? value(previous) : value
      if (!Number.isFinite(next)) return previous
      if (next < 0) return 0
      return totalPages > 0 ? Math.min(next, totalPages - 1) : 0
    })
  }, [totalPages])

  return {
    cotizaciones,
    page,
    size,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setPage,
    setDisplayedPage,
    fetchCotizaciones,
    refreshCotizaciones,
  }
}
