"use client"

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import { resolvePagoDateRange, validatePagoFilters } from "@/lib/pago-filters"
import type { PagoFilters, PagoListado, PagoPageResponse } from "@/lib/types/pago"

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 400) return "Filtros invalidos para listar pagos"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para listar pagos"
  if (status === 404) return "No se encontraron pagos con esos filtros"
  if (status === 500) return "Error interno del servidor"
  return "Error inesperado al cargar pagos"
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function normalizePago(value: unknown): PagoListado | null {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>

  const idPago = Number(item.idPago)
  if (!Number.isFinite(idPago) || idPago <= 0) return null

  const idMetodoPago = Number(item.idMetodoPago)
  const idVenta = Number(item.idVenta)
  const idCliente = Number(item.idCliente)
  const idUsuario = Number(item.idUsuario)
  const idSucursal = Number(item.idSucursal)

  return {
    idPago,
    fecha: typeof item.fecha === "string" ? item.fecha : "",
    monto: Number(item.monto) || 0,
    codigoOperacion:
      typeof item.codigoOperacion === "string" && item.codigoOperacion.trim().length > 0
        ? item.codigoOperacion
        : null,
    idMetodoPago: Number.isFinite(idMetodoPago) && idMetodoPago > 0 ? idMetodoPago : null,
    metodoPago: typeof item.metodoPago === "string" ? item.metodoPago : "DESCONOCIDO",
    idVenta: Number.isFinite(idVenta) && idVenta > 0 ? idVenta : null,
    tipoComprobante:
      typeof item.tipoComprobante === "string" ? item.tipoComprobante : "SIN COMPROBANTE",
    serie: typeof item.serie === "string" ? item.serie : "",
    correlativo: Number(item.correlativo) || 0,
    idCliente: Number.isFinite(idCliente) && idCliente > 0 ? idCliente : null,
    nombreCliente:
      typeof item.nombreCliente === "string" && item.nombreCliente.trim().length > 0
        ? item.nombreCliente
        : "Sin cliente",
    idUsuario: Number.isFinite(idUsuario) && idUsuario > 0 ? idUsuario : null,
    nombreUsuario:
      typeof item.nombreUsuario === "string" && item.nombreUsuario.trim().length > 0
        ? item.nombreUsuario
        : "Sin usuario",
    idSucursal: Number.isFinite(idSucursal) && idSucursal > 0 ? idSucursal : null,
    nombreSucursal:
      typeof item.nombreSucursal === "string" && item.nombreSucursal.trim().length > 0
        ? item.nombreSucursal
        : "Sin sucursal",
  }
}

function buildQueryParams(
  pageNumber: number,
  filters: PagoFilters,
  debouncedSearch: string
): URLSearchParams {
  const params = new URLSearchParams({
    page: String(pageNumber),
  })

  const normalizedSearch = debouncedSearch.trim()
  if (normalizedSearch.length > 0) {
    params.set("q", normalizedSearch)
  }

  if (typeof filters.idMetodoPago === "number" && filters.idMetodoPago > 0) {
    params.set("idMetodoPago", String(filters.idMetodoPago))
  }

  if (typeof filters.idUsuario === "number" && filters.idUsuario > 0) {
    params.set("idUsuario", String(filters.idUsuario))
  }

  if (typeof filters.idSucursal === "number" && filters.idSucursal > 0) {
    params.set("idSucursal", String(filters.idSucursal))
  }

  const { desde, hasta } = resolvePagoDateRange(filters)

  if (desde) params.set("desde", desde)
  if (hasta) params.set("hasta", hasta)

  return params
}

export function usePagos(filters: PagoFilters) {
  const { isLoading: isAuthLoading } = useAuth()
  const {
    periodo,
    usarRangoFechas,
    fecha,
    fechaDesde,
    fechaHasta,
    idMetodoPago,
    idSucursal,
    idUsuario,
  } = filters

  const [pagos, setPagos] = useState<PagoListado[]>([])
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
    periodo,
    usarRangoFechas,
    fecha,
    fechaDesde,
    fechaHasta,
    idMetodoPago,
    idSucursal,
    idUsuario,
  ])

  const fetchPagos = useCallback(
    async (pageNumber: number) => {
      listAbortRef.current?.abort()
      const controller = new AbortController()
      listAbortRef.current = controller

      setLoading(true)
      setError(null)

      const requestFilters: PagoFilters = {
        search: debouncedSearch,
        idUsuario,
        idMetodoPago,
        idSucursal,
        periodo,
        usarRangoFechas,
        fecha,
        fechaDesde,
        fechaHasta,
      }

      const validationError = validatePagoFilters(requestFilters)
      if (validationError) {
        setLoading(false)
        setError(validationError)
        setPagos([])
        setTotalPages(0)
        setTotalElements(0)
        setNumberOfElements(0)
        return
      }

      try {
        const queryParams = buildQueryParams(pageNumber, requestFilters, debouncedSearch)
        const response = await authFetch(`/api/pago/listar?${queryParams.toString()}`, {
          signal: controller.signal,
        })
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          setPagos([])
          setTotalPages(0)
          setTotalElements(0)
          setNumberOfElements(0)
          toast.error(message)
          return
        }

        const pageData = data as PagoPageResponse | null
        const content = Array.isArray(pageData?.content) ? pageData.content : []
        const normalizedContent = content
          .map((item) => normalizePago(item))
          .filter((item): item is PagoListado => item !== null)

        setPagos(normalizedContent)
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
        setPagos([])
        setTotalPages(0)
        setTotalElements(0)
        setNumberOfElements(0)
        toast.error(message)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [
      debouncedSearch,
      periodo,
      usarRangoFechas,
      fecha,
      fechaDesde,
      fechaHasta,
      idMetodoPago,
      idSucursal,
      idUsuario,
    ]
  )

  useEffect(() => {
    if (isAuthLoading) return
    void fetchPagos(page)
  }, [fetchPagos, isAuthLoading, page])

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort()
    }
  }, [])

  const refreshPagos = useCallback(async () => {
    await fetchPagos(page)
  }, [fetchPagos, page])

  const setDisplayedPage = useCallback<Dispatch<SetStateAction<number>>>(
    (value) => {
      setPage((previous) => {
        const next = typeof value === "function" ? value(previous) : value
        if (!Number.isFinite(next)) return previous
        if (next < 0) return 0
        return totalPages > 0 ? Math.min(next, totalPages - 1) : 0
      })
    },
    [totalPages]
  )

  return {
    pagos,
    page,
    size,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setPage,
    setDisplayedPage,
    refreshPagos,
  }
}
