"use client"

import { useCallback, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { CotizacionDetalleResponse, CotizacionResponse, EstadoCotizacion, TipoDescuentoCotizacion } from "@/lib/types/cotizacion"

interface CotizacionDetalleState {
  open: boolean
  cotizacionId: number | null
  detalle: CotizacionResponse | null
  loading: boolean
  error: string | null
}

function numberOr(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function nullableNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function stringOr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function parseDetalleItems(value: unknown): CotizacionDetalleResponse[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item): CotizacionDetalleResponse | null => {
      if (!item || typeof item !== "object") return null
      const data = item as Record<string, unknown>

      return {
        idCotizacionDetalle: numberOr(data.idCotizacionDetalle),
        idProductoVariante: numberOr(data.idProductoVariante),
        idProducto: numberOr(data.idProducto),
        nombreProducto: stringOr(data.nombreProducto, "Producto"),
        sku: typeof data.sku === "string" ? data.sku : null,
        precioOferta: typeof data.precioOferta === "number" ? data.precioOferta : null,
        ofertaInicio:
          typeof data.ofertaInicio === "string" ? data.ofertaInicio : null,
        ofertaFin:
          typeof data.ofertaFin === "string" ? data.ofertaFin : null,
        idColor: nullableNumber(data.idColor),
        color: typeof data.color === "string" ? data.color : null,
        idTalla: nullableNumber(data.idTalla),
        talla: typeof data.talla === "string" ? data.talla : null,
        cantidad: numberOr(data.cantidad),
        precioUnitario: numberOr(data.precioUnitario),
        descuento: numberOr(data.descuento),
        subtotal: numberOr(data.subtotal),
      }
    })
    .filter((item): item is CotizacionDetalleResponse => item !== null)
}

function parseCotizacionDetalle(value: unknown): CotizacionResponse | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>
  const idCotizacion = numberOr(payload.idCotizacion)
  if (idCotizacion <= 0) return null

  return {
    idCotizacion,
    fecha: stringOr(payload.fecha),
    serie: stringOr(payload.serie, "COT"),
    correlativo: numberOr(payload.correlativo),
    igvPorcentaje: numberOr(payload.igvPorcentaje),
    subtotal: numberOr(payload.subtotal),
    descuentoTotal: numberOr(payload.descuentoTotal),
    tipoDescuento:
      typeof payload.tipoDescuento === "string"
        ? (payload.tipoDescuento as TipoDescuentoCotizacion)
        : null,
    igv: numberOr(payload.igv),
    total: numberOr(payload.total),
    estado: stringOr(payload.estado, "ACTIVA") as EstadoCotizacion,
    observacion: typeof payload.observacion === "string" ? payload.observacion : null,
    idCliente: nullableNumber(payload.idCliente),
    nombreCliente: stringOr(payload.nombreCliente, "Sin cliente"),
    idUsuario: nullableNumber(payload.idUsuario),
    nombreUsuario: stringOr(payload.nombreUsuario, "Sin usuario"),
    idSucursal: nullableNumber(payload.idSucursal),
    nombreSucursal: stringOr(payload.nombreSucursal, "Sin sucursal"),
    detalles: parseDetalleItems(payload.detalles),
  }
}

export function useCotizacionDetalle() {
  const abortRef = useRef<AbortController | null>(null)
  const [state, setState] = useState<CotizacionDetalleState>({
    open: false,
    cotizacionId: null,
    detalle: null,
    loading: false,
    error: null,
  })

  const fetchDetalle = useCallback(async (idCotizacion: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState((previous) => ({
      ...previous,
      open: true,
      cotizacionId: idCotizacion,
      loading: true,
      error: null,
    }))

    try {
      const response = await authFetch(`/api/cotizacion/detalle/${idCotizacion}`, {
        cache: "no-store",
        signal: controller.signal,
      })
      const payload = await response.json().catch(() => null)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : `Error ${response.status} al cargar detalle de cotizacion`

        setState((previous) => ({
          ...previous,
          detalle: null,
          loading: false,
          error: message,
        }))
        return
      }

      const detalle = parseCotizacionDetalle(payload)
      if (!detalle) {
        setState((previous) => ({
          ...previous,
          detalle: null,
          loading: false,
          error: "El detalle de cotizacion no tiene el formato esperado",
        }))
        return
      }

      setState((previous) => ({
        ...previous,
        detalle,
        loading: false,
        error: null,
      }))
    } catch (requestError) {
      if (controller.signal.aborted) return
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar el detalle de la cotizacion"
      setState((previous) => ({
        ...previous,
        detalle: null,
        loading: false,
        error: message,
      }))
    }
  }, [])

  const openCotizacionDetalle = useCallback(
    async (idCotizacion: number) => {
      if (!Number.isFinite(idCotizacion) || idCotizacion <= 0) return
      await fetchDetalle(idCotizacion)
    },
    [fetchDetalle]
  )

  const retryCotizacionDetalle = useCallback(async () => {
    if (!state.cotizacionId) return
    await fetchDetalle(state.cotizacionId)
  }, [fetchDetalle, state.cotizacionId])

  const closeCotizacionDetalle = useCallback(() => {
    abortRef.current?.abort()
    setState((previous) => ({
      ...previous,
      open: false,
      loading: false,
    }))
  }, [])

  return {
    ...state,
    openCotizacionDetalle,
    retryCotizacionDetalle,
    closeCotizacionDetalle,
  }
}
