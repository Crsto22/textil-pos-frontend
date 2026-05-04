"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type {
  NotaCreditoDetalleItem,
  NotaCreditoDetalleResponse,
} from "@/lib/types/nota-credito"

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
  return typeof value === "string" && value.trim() ? value : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function unwrapResponsePayload(value: unknown): Record<string, unknown> | null {
  const payload = asRecord(value)
  if (!payload) return null
  return asRecord(payload.response) ?? payload
}

function getResponseMessage(payload: unknown, fallback: string): string {
  const data = asRecord(payload)
  if (!data) return fallback
  return typeof data.message === "string" && data.message.trim() ? data.message : fallback
}

function parseDetalleItems(value: unknown): NotaCreditoDetalleItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): NotaCreditoDetalleItem | null => {
      const data = asRecord(item)
      if (!data) return null
      return {
        idNotaCreditoDetalle: numberOr(data.idNotaCreditoDetalle),
        idVentaDetalleReferencia: nullableNumber(data.idVentaDetalleReferencia),
        idProductoVariante: numberOr(data.idProductoVariante),
        idProducto: numberOr(data.idProducto),
        nombreProducto: stringOr(data.nombreProducto, "Producto"),
        descripcion: stringOr(data.descripcion, stringOr(data.nombreProducto, "Producto")),
        sku: stringOrNull(data.sku),
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
    .filter((item): item is NotaCreditoDetalleItem => item !== null)
}

function parseNotaCreditoDetalle(value: unknown): NotaCreditoDetalleResponse | null {
  const payload = unwrapResponsePayload(value)
  if (!payload) return null
  const idNotaCredito = numberOr(payload.idNotaCredito)
  if (idNotaCredito <= 0) return null

  return {
    idNotaCredito,
    fecha: stringOr(payload.fecha),
    tipoComprobante: stringOr(payload.tipoComprobante, "NOTA_CREDITO"),
    serie: stringOr(payload.serie),
    correlativo: numberOr(payload.correlativo),
    numeroNotaCredito: stringOrNull(payload.numeroNotaCredito),
    moneda: stringOr(payload.moneda, "PEN"),
    codigoMotivo: stringOr(payload.codigoMotivo, "07"),
    descripcionMotivo: stringOr(payload.descripcionMotivo, "Sin descripcion"),
    tipoDocumentoRef: stringOrNull(payload.tipoDocumentoRef),
    serieRef: stringOrNull(payload.serieRef),
    correlativoRef: nullableNumber(payload.correlativoRef),
    numeroDocumentoReferencia: stringOrNull(payload.numeroDocumentoReferencia),
    idVentaReferencia: nullableNumber(payload.idVentaReferencia),
    numeroVentaReferencia: stringOrNull(payload.numeroVentaReferencia),
    tipoComprobanteVentaReferencia: stringOrNull(payload.tipoComprobanteVentaReferencia),
    igvPorcentaje: numberOr(payload.igvPorcentaje),
    subtotal: numberOr(payload.subtotal),
    descuentoTotal: numberOr(payload.descuentoTotal),
    igv: numberOr(payload.igv),
    total: numberOr(payload.total),
    estado: stringOr(payload.estado, "DESCONOCIDO"),
    stockDevuelto: payload.stockDevuelto === true,
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
    tipoAnulacion: stringOrNull(payload.tipoAnulacion),
    motivoAnulacion: stringOrNull(payload.motivoAnulacion),
    anuladoAt: stringOrNull(payload.anuladoAt),
    idUsuarioAnulacion: nullableNumber(payload.idUsuarioAnulacion),
    nombreUsuarioAnulacion: stringOrNull(payload.nombreUsuarioAnulacion),
    sunatBajaEstado: stringOrNull(payload.sunatBajaEstado),
    sunatBajaCodigo: stringOrNull(payload.sunatBajaCodigo),
    sunatBajaMensaje: stringOrNull(payload.sunatBajaMensaje),
    sunatBajaTicket: stringOrNull(payload.sunatBajaTicket),
    sunatBajaTipo: stringOrNull(payload.sunatBajaTipo),
    sunatBajaLoteId: nullableNumber(payload.sunatBajaLoteId),
    sunatBajaLote: stringOrNull(payload.sunatBajaLote),
    sunatBajaSolicitadaAt: stringOrNull(payload.sunatBajaSolicitadaAt),
    sunatBajaRespondidaAt: stringOrNull(payload.sunatBajaRespondidaAt),
    idCliente: nullableNumber(payload.idCliente),
    tipoDocumentoCliente: stringOrNull(payload.tipoDocumentoCliente),
    nroDocumentoCliente: stringOrNull(payload.nroDocumentoCliente),
    nombreCliente: stringOr(payload.nombreCliente, "Sin cliente"),
    telefonoCliente: stringOrNull(payload.telefonoCliente),
    correoCliente: stringOrNull(payload.correoCliente),
    direccionCliente: stringOrNull(payload.direccionCliente),
    idUsuario: nullableNumber(payload.idUsuario),
    nombreUsuario: stringOr(payload.nombreUsuario, "Sin usuario"),
    idSucursal: nullableNumber(payload.idSucursal),
    nombreSucursal: stringOr(payload.nombreSucursal, "Sin sucursal"),
    idEmpresa: nullableNumber(payload.idEmpresa),
    nombreEmpresa: stringOrNull(payload.nombreEmpresa),
    rucEmpresa: stringOrNull(payload.rucEmpresa),
    detalles: parseDetalleItems(payload.detalles),
  }
}

export function useNotaCreditoDetalle() {
  const abortRef = useRef<AbortController | null>(null)
  const [detalle, setDetalle] = useState<NotaCreditoDetalleResponse | null>(null)
  const [notaCreditoId, setNotaCreditoId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetalle = useCallback(async (id: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setNotaCreditoId(id)
    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(`/api/nota-credito/detalle/${id}`, {
        cache: "no-store",
        signal: controller.signal,
      })
      const payload = await response.json().catch(() => null)
      if (controller.signal.aborted) return

      if (!response.ok) {
        setDetalle(null)
        setError(getResponseMessage(payload, "No se pudo obtener el detalle de la nota de credito"))
        return
      }

      const parsed = parseNotaCreditoDetalle(payload)
      if (!parsed) {
        setDetalle(null)
        setError("El detalle de nota de credito no tiene el formato esperado")
        return
      }

      setDetalle(parsed)
    } catch (requestError) {
      if (controller.signal.aborted) return
      setDetalle(null)
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar el detalle de la nota de credito"
      )
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  const openNotaCreditoDetalle = useCallback(
    async (id: number) => {
      if (!Number.isFinite(id) || id <= 0) return
      await fetchDetalle(id)
    },
    [fetchDetalle]
  )

  const retryNotaCreditoDetalle = useCallback(async () => {
    if (!notaCreditoId) return
    await fetchDetalle(notaCreditoId)
  }, [fetchDetalle, notaCreditoId])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return {
    detalle,
    loading,
    error,
    openNotaCreditoDetalle,
    retryNotaCreditoDetalle,
  }
}
