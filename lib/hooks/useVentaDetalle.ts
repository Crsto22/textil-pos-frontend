"use client"

import { useCallback, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { VentaDetalleItem, VentaDetallePago, VentaDetalleResponse } from "@/lib/types/venta"

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
        sku: typeof data.sku === "string" ? data.sku : null,
        codigoExterno: typeof data.codigoExterno === "string" ? data.codigoExterno : null,
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
        metodoPago: stringOr(data.metodoPago, "DESCONOCIDO"),
        monto: numberOr(data.monto),
        referencia: typeof data.referencia === "string" ? data.referencia : null,
        fecha: stringOr(data.fecha),
      }
    })
    .filter((item): item is VentaDetallePago => item !== null)
}

function parseVentaDetalle(value: unknown): VentaDetalleResponse | null {
  if (!value || typeof value !== "object") return null
  const payload = value as Record<string, unknown>
  const idVenta = numberOr(payload.idVenta)
  if (idVenta <= 0) return null

  return {
    idVenta,
    fecha: stringOr(payload.fecha),
    tipoComprobante: stringOr(payload.tipoComprobante, "TICKET"),
    serie: stringOr(payload.serie),
    correlativo: numberOr(payload.correlativo),
    igvPorcentaje: numberOr(payload.igvPorcentaje),
    subtotal: numberOr(payload.subtotal),
    descuentoTotal: numberOr(payload.descuentoTotal),
    tipoDescuento: typeof payload.tipoDescuento === "string" ? payload.tipoDescuento : null,
    igv: numberOr(payload.igv),
    total: numberOr(payload.total),
    estado: stringOr(payload.estado, "DESCONOCIDO"),
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

export function useVentaDetalle() {
  const abortRef = useRef<AbortController | null>(null)
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
        const message =
          payload &&
          typeof payload === "object" &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : `Error ${response.status} al cargar detalle de venta`
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
    openVentaDetalle,
    retryVentaDetalle,
    closeVentaDetalle,
  }
}
