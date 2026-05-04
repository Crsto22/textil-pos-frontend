"use client"

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"
import {
  GUIA_REMISION_MOTIVO_FIJO,
  type GuiaRemisionFilters,
  type GuiaRemisionListItem,
  type GuiaRemisionPageResponse,
} from "@/lib/types/guia-remision"

function getErrorMessage(status: number, backendMsg?: string): string {
  if (backendMsg) return backendMsg
  if (status === 400) return "Filtros invalidos para listar GRE remitente"
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos para listar GRE remitente"
  if (status === 404) return "No se encontraron GRE remitente con esos filtros"
  if (status === 500) return "Error interno del servidor"
  return "Error inesperado al cargar GRE remitente"
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

function normalizeGuiaRemision(value: unknown): GuiaRemisionListItem | null {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>

  const idGuiaRemision = Number(item.idGuiaRemision)
  if (!Number.isFinite(idGuiaRemision) || idGuiaRemision <= 0) return null

  return {
    idGuiaRemision,
    numeroGuiaRemision:
      typeof item.numeroGuiaRemision === "string" ? item.numeroGuiaRemision : "",
    serie: typeof item.serie === "string" ? item.serie : "",
    correlativo: Number(item.correlativo) || 0,
    fechaEmision: typeof item.fechaEmision === "string" ? item.fechaEmision : null,
    fechaInicioTraslado:
      typeof item.fechaInicioTraslado === "string" ? item.fechaInicioTraslado : "",
    motivoTraslado:
      typeof item.motivoTraslado === "string" ? item.motivoTraslado : GUIA_REMISION_MOTIVO_FIJO,
    descripcionMotivo: normalizeNullableString(item.descripcionMotivo),
    modalidadTransporte:
      typeof item.modalidadTransporte === "string"
        ? (item.modalidadTransporte as "01" | "02")
        : "02",
    pesoBrutoTotal: Number(item.pesoBrutoTotal) || 0,
    unidadPeso: typeof item.unidadPeso === "string" ? item.unidadPeso : "KGM",
    numeroBultos: Number.isFinite(Number(item.numeroBultos))
      ? Number(item.numeroBultos)
      : null,
    observaciones:
      typeof item.observaciones === "string" ? item.observaciones : null,
    ubigeoPartida: typeof item.ubigeoPartida === "string" ? item.ubigeoPartida : "",
    direccionPartida:
      typeof item.direccionPartida === "string" ? item.direccionPartida : "",
    idSucursalPartida: Number.isFinite(Number(item.idSucursalPartida))
      ? Number(item.idSucursalPartida)
      : null,
    nombreSucursalPartida: normalizeNullableString(item.nombreSucursalPartida),
    ubigeoLlegada: typeof item.ubigeoLlegada === "string" ? item.ubigeoLlegada : "",
    direccionLlegada:
      typeof item.direccionLlegada === "string" ? item.direccionLlegada : "",
    idSucursalLlegada: Number.isFinite(Number(item.idSucursalLlegada))
      ? Number(item.idSucursalLlegada)
      : null,
    nombreSucursalLlegada: normalizeNullableString(item.nombreSucursalLlegada),
    destinatarioNroDoc:
      typeof item.destinatarioNroDoc === "string" ? item.destinatarioNroDoc : "",
    destinatarioTipoDoc: normalizeNullableString(item.destinatarioTipoDoc),
    destinatarioRazonSocial:
      typeof item.destinatarioRazonSocial === "string"
        ? item.destinatarioRazonSocial
        : "",
    estado: typeof item.estado === "string" ? item.estado : "BORRADOR",
    sunatEstado:
      typeof item.sunatEstado === "string" && item.sunatEstado.trim()
        ? item.sunatEstado
        : null,
    sunatCodigo: normalizeNullableString(item.sunatCodigo),
    sunatMensaje: normalizeNullableString(item.sunatMensaje),
    sunatCdrNombre: normalizeNullableString(item.sunatCdrNombre),
    idUsuario: Number.isFinite(Number(item.idUsuario)) ? Number(item.idUsuario) : null,
    nombreUsuario: normalizeNullableString(item.nombreUsuario),
    idSucursal: Number.isFinite(Number(item.idSucursal)) ? Number(item.idSucursal) : null,
    nombreSucursal: normalizeNullableString(item.nombreSucursal),
  }
}

function buildQueryParams(
  pageNumber: number,
  filters: GuiaRemisionFilters,
  debouncedSearch: string
): URLSearchParams {
  const params = new URLSearchParams({ page: String(pageNumber) })

  const normalizedSearch = debouncedSearch.trim()
  if (normalizedSearch.length > 0) {
    params.set("q", normalizedSearch)
  }

  if (filters.estado !== "TODOS") {
    params.set("estado", filters.estado)
  }

  if (filters.sunatEstado !== "TODOS") {
    params.set("sunatEstado", filters.sunatEstado)
  }

  if (typeof filters.idSucursal === "number" && filters.idSucursal > 0) {
    params.set("idSucursal", String(filters.idSucursal))
  }

  return params
}

export function useGuiasRemision(filters: GuiaRemisionFilters) {
  const { isLoading: isAuthLoading } = useAuth()

  const [guias, setGuias] = useState<GuiaRemisionListItem[]>([])
  const [page, setPage] = useState(0)
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
  }, [filters.estado, filters.sunatEstado, filters.idSucursal])

  const fetchGuias = useCallback(
    async (pageNumber: number) => {
      listAbortRef.current?.abort()
      const controller = new AbortController()
      listAbortRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const queryParams = buildQueryParams(pageNumber, filters, debouncedSearch)
        const response = await authFetch(`/api/guia-remision?${queryParams.toString()}`, {
          signal: controller.signal,
        })
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (!response.ok) {
          const message = getErrorMessage(response.status, data?.message)
          setError(message)
          setGuias([])
          setTotalPages(0)
          setTotalElements(0)
          setNumberOfElements(0)
          toast.error(message)
          return
        }

        const pageData = data as GuiaRemisionPageResponse | null
        const content = Array.isArray(pageData?.content) ? pageData.content : []
        const normalizedContent = content
          .map((item) => normalizeGuiaRemision(item))
          .filter((item): item is GuiaRemisionListItem => item !== null)

        setGuias(normalizedContent)
        setPage(typeof pageData?.page === "number" ? pageData.page : pageNumber)
        setTotalPages(typeof pageData?.totalPages === "number" ? pageData.totalPages : 0)
        setTotalElements(
          typeof pageData?.totalElements === "number" ? pageData.totalElements : 0
        )
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
        setGuias([])
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
    [debouncedSearch, filters]
  )

  useEffect(() => {
    if (isAuthLoading) return
    void fetchGuias(page)
  }, [fetchGuias, isAuthLoading, page])

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort()
    }
  }, [])

  const refreshGuias = useCallback(async () => {
    await fetchGuias(page)
  }, [fetchGuias, page])

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
    guias,
    page,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setDisplayedPage,
    refreshGuias,
  }
}
