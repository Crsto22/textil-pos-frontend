"use client"

import { useCallback, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  VentaDetalleItem,
  VentaDetallePago,
  VentaDetalleResponse,
  VentaSunatRetryResponse,
} from "@/lib/types/venta"

interface VentaDetalleState {
  open: boolean
  ventaId: number | null
  detalle: VentaDetalleResponse | null
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

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function unwrapResponsePayload(value: unknown): Record<string, unknown> | null {
  const payload = asRecord(value)
  if (!payload) return null
  return asRecord(payload.response) ?? payload
}

function parseDetalleItems(value: unknown): VentaDetalleItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): VentaDetalleItem | null => {
      if (!item || typeof item !== "object") return null
      const data = item as Record<string, unknown>
      return {
        idVentaDetalle: numberOr(data.idVentaDetalle),
        idProductoVariante: numberOr(data.idProductoVariante),
        idProducto: numberOr(data.idProducto),
        nombreProducto: stringOr(data.nombreProducto, "Producto"),
        descripcion: stringOr(data.descripcion, stringOr(data.nombreProducto, "Producto")),
        sku: typeof data.sku === "string" ? data.sku : null,
        precioOferta: nullableNumber(data.precioOferta),
        ofertaInicio: stringOrNull(data.ofertaInicio),
        ofertaFin: stringOrNull(data.ofertaFin),
        idColor: nullableNumber(data.idColor),
        color: stringOrNull(data.color),
        idTalla: nullableNumber(data.idTalla),
        talla: stringOrNull(data.talla),
        cantidad: numberOr(data.cantidad),
        unidadMedida: stringOr(data.unidadMedida, "NIU"),
        codigoTipoAfectacionIgv: stringOr(data.codigoTipoAfectacionIgv, "10"),
        precioUnitario: numberOr(data.precioUnitario),
        descuento: numberOr(data.descuento),
        igvDetalle: numberOr(data.igvDetalle),
        subtotal: numberOr(data.subtotal),
        totalDetalle: numberOr(data.totalDetalle),
      }
    })
    .filter((item): item is VentaDetalleItem => item !== null)
}

function parseDetallePagos(value: unknown): VentaDetallePago[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): VentaDetallePago | null => {
      if (!item || typeof item !== "object") return null
      const data = item as Record<string, unknown>
      return {
        idPago: numberOr(data.idPago),
        idMetodoPago: numberOr(data.idMetodoPago),
        nombreMetodoPago: stringOr(
          data.nombreMetodoPago,
          stringOr(data.metodoPago, "DESCONOCIDO")
        ),
        monto: numberOr(data.monto),
        codigoOperacion: stringOrNull(data.codigoOperacion ?? data.referencia),
        fecha: stringOrNull(data.fecha),
      }
    })
    .filter((item): item is VentaDetallePago => item !== null)
}

function parseVentaDetalle(value: unknown): VentaDetalleResponse | null {
  const payload = unwrapResponsePayload(value)
  if (!payload) return null
  const idVenta = numberOr(payload.idVenta)
  if (idVenta <= 0) return null

  return {
    idVenta,
    fecha: stringOr(payload.fecha),
    tipoComprobante: stringOr(payload.tipoComprobante, "NOTA DE VENTA"),
    serie: stringOr(payload.serie),
    correlativo: numberOr(payload.correlativo),
    moneda: stringOr(payload.moneda, "PEN"),
    igvPorcentaje: numberOr(payload.igvPorcentaje),
    subtotal: numberOr(payload.subtotal),
    descuentoTotal: numberOr(payload.descuentoTotal),
    tipoDescuento: stringOrNull(payload.tipoDescuento),
    igv: numberOr(payload.igv),
    total: numberOr(payload.total),
    estado: stringOr(payload.estado, "DESCONOCIDO"),
    sunatEstado: stringOrNull(payload.sunatEstado),
    sunatCodigo: stringOrNull(payload.sunatCodigo),
    sunatMensaje: stringOrNull(payload.sunatMensaje),
    sunatHash: stringOrNull(payload.sunatHash),
    sunatTicket: stringOrNull(payload.sunatTicket),
    sunatXmlNombre: stringOrNull(payload.sunatXmlNombre),
    sunatZipNombre: stringOrNull(payload.sunatZipNombre),
    sunatCdrNombre: stringOrNull(payload.sunatCdrNombre),
    sunatEnviadoAt: stringOrNull(payload.sunatEnviadoAt),
    sunatRespondidoAt: stringOrNull(payload.sunatRespondidoAt),
    idCliente: nullableNumber(payload.idCliente),
    nombreCliente: stringOr(payload.nombreCliente, "Sin cliente"),
    idUsuario: nullableNumber(payload.idUsuario),
    nombreUsuario: stringOr(payload.nombreUsuario, "Sin usuario"),
    idSucursal: nullableNumber(payload.idSucursal),
    nombreSucursal: stringOr(payload.nombreSucursal, "Sin sucursal"),
    detalles: parseDetalleItems(payload.detalles),
    pagos: parseDetallePagos(payload.pagos),
  }
}

function parseVentaSunatRetryResponse(value: unknown): VentaSunatRetryResponse | null {
  const payload = unwrapResponsePayload(value)
  if (!payload) return null

  const idVenta = numberOr(payload.idVenta)
  if (idVenta <= 0) return null

  return {
    idVenta,
    sunatEstado: stringOrNull(payload.sunatEstado),
    sunatCodigo: stringOrNull(payload.sunatCodigo),
    sunatMensaje: stringOrNull(payload.sunatMensaje),
    sunatXmlNombre: stringOrNull(payload.sunatXmlNombre),
    sunatZipNombre: stringOrNull(payload.sunatZipNombre),
    sunatCdrNombre: stringOrNull(payload.sunatCdrNombre),
  }
}

function mergeSunatRetryIntoDetalle(
  detalle: VentaDetalleResponse | null,
  payload: VentaSunatRetryResponse
): VentaDetalleResponse | null {
  if (!detalle || detalle.idVenta !== payload.idVenta) return detalle

  return {
    ...detalle,
    sunatEstado: payload.sunatEstado ?? detalle.sunatEstado,
    sunatCodigo: payload.sunatCodigo ?? detalle.sunatCodigo,
    sunatMensaje: payload.sunatMensaje ?? detalle.sunatMensaje,
    sunatXmlNombre: payload.sunatXmlNombre ?? detalle.sunatXmlNombre,
    sunatZipNombre: payload.sunatZipNombre ?? detalle.sunatZipNombre,
    sunatCdrNombre: payload.sunatCdrNombre ?? detalle.sunatCdrNombre,
  }
}

function getResponseMessage(payload: unknown, fallback: string): string {
  const data = asRecord(payload)
  if (!data) return fallback

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message
  }

  return fallback
}

export function useVentaDetalle() {
  const abortRef = useRef<AbortController | null>(null)
  const [retryingSunat, setRetryingSunat] = useState(false)
  const [state, setState] = useState<VentaDetalleState>({
    open: false,
    ventaId: null,
    detalle: null,
    loading: false,
    error: null,
  })

  const fetchDetalle = useCallback(async (idVenta: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState((previous) => ({
      ...previous,
      open: true,
      ventaId: idVenta,
      loading: true,
      error: null,
    }))

    try {
      const response = await authFetch(`/api/venta/detalle/${idVenta}`, {
        cache: "no-store",
        signal: controller.signal,
      })
      const payload = await response.json().catch(() => null)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getResponseMessage(
          payload,
          `Error ${response.status} al cargar detalle de venta`
        )
        setState((previous) => ({
          ...previous,
          detalle: null,
          loading: false,
          error: message,
        }))
        return
      }

      const detalle = parseVentaDetalle(payload)
      if (!detalle) {
        setState((previous) => ({
          ...previous,
          detalle: null,
          loading: false,
          error: "El detalle de venta no tiene el formato esperado",
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
          : "No se pudo cargar el detalle de la venta"
      setState((previous) => ({
        ...previous,
        detalle: null,
        loading: false,
        error: message,
      }))
    }
  }, [])

  const openVentaDetalle = useCallback(
    async (idVenta: number) => {
      if (!Number.isFinite(idVenta) || idVenta <= 0) return
      await fetchDetalle(idVenta)
    },
    [fetchDetalle]
  )

  const retryVentaDetalle = useCallback(async () => {
    if (!state.ventaId) return
    await fetchDetalle(state.ventaId)
  }, [fetchDetalle, state.ventaId])

  const retrySunatVenta = useCallback(async () => {
    if (!state.ventaId || retryingSunat) {
      return { ok: false, message: "No hay una venta seleccionada" }
    }

    setRetryingSunat(true)
    try {
      const response = await authFetch(`/api/venta/${state.ventaId}/sunat/reintentar`, {
        method: "POST",
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message = getResponseMessage(
          payload,
          `Error ${response.status} al reenviar a SUNAT`
        )
        return { ok: false, message }
      }

      const sunatPayload = parseVentaSunatRetryResponse(payload)
      if (!sunatPayload) {
        return {
          ok: false,
          message: "La respuesta de reintento SUNAT no tiene el formato esperado",
        }
      }

      setState((previous) => ({
        ...previous,
        detalle: mergeSunatRetryIntoDetalle(previous.detalle, sunatPayload),
        error: null,
      }))

      return {
        ok: true,
        message:
          sunatPayload.sunatMensaje ??
          (sunatPayload.sunatEstado
            ? `Estado SUNAT actualizado a ${sunatPayload.sunatEstado}`
            : "Envio a SUNAT reintentado correctamente"),
      }
    } catch (requestError) {
      return {
        ok: false,
        message:
          requestError instanceof Error
            ? requestError.message
            : "No se pudo reenviar la venta a SUNAT",
      }
    } finally {
      setRetryingSunat(false)
    }
  }, [retryingSunat, state.ventaId])

  const closeVentaDetalle = useCallback(() => {
    abortRef.current?.abort()
    setState((previous) => ({
      ...previous,
      open: false,
      loading: false,
    }))
  }, [])

  return {
    ...state,
    retryingSunat,
    openVentaDetalle,
    retryVentaDetalle,
    retrySunatVenta,
    closeVentaDetalle,
  }
}
