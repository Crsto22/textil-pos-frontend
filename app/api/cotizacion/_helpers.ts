import type { NextRequest } from "next/server"

import {
  COTIZACION_ESTADOS,
  COTIZACION_ESTADOS_EDITABLES,
  type EstadoCotizacion,
  type EstadoCotizacionEditable,
} from "@/lib/types/cotizacion"

const ESTADOS_COTIZACION = new Set<string>(COTIZACION_ESTADOS)
const ESTADOS_COTIZACION_EDITABLES = new Set<string>(COTIZACION_ESTADOS_EDITABLES)

interface CotizacionDetallePayload {
  idProductoVariante: number
  cantidad: number
  precioUnitario: number
  descuento: number
}

interface CotizacionWritePayload {
  idSucursal: number
  idCliente: number
  igvPorcentaje?: number
  descuentoTotal?: number | null
  tipoDescuento?: string | null
  observacion?: string | null
  detalles: CotizacionDetallePayload[]
}

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string }

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function getPositiveInteger(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function getNonNegativeNumber(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

function getTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export function getProxyHeaders(
  request: NextRequest,
  options?: { includeJsonContentType?: boolean }
): HeadersInit {
  const headers: HeadersInit = {}
  if (options?.includeJsonContentType) {
    headers["Content-Type"] = "application/json"
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    headers["Authorization"] = authHeader
  }

  return headers
}

export async function parseBackendBody(response: Response, fallbackMessage: string) {
  const text = await response.text()

  let data: Record<string, unknown>
  try {
    const parsed = JSON.parse(text)
    data = asRecord(parsed) ?? { data: parsed }
  } catch {
    data = { message: text || fallbackMessage }
  }

  const message =
    typeof data.message === "string"
      ? data.message
      : typeof data.error === "string"
        ? data.error
        : fallbackMessage

  return { data, message }
}

export function normalizeCotizacionEstado(value: unknown): EstadoCotizacion | null {
  const normalized = getTrimmedString(value)?.toUpperCase()
  if (!normalized || !ESTADOS_COTIZACION.has(normalized)) return null
  return normalized as EstadoCotizacion
}

export function normalizeCotizacionEstadoEditable(
  value: unknown
): EstadoCotizacionEditable | null {
  const normalized = getTrimmedString(value)?.toUpperCase()
  if (!normalized || !ESTADOS_COTIZACION_EDITABLES.has(normalized)) return null
  return normalized as EstadoCotizacionEditable
}

function normalizeCotizacionDetalle(
  value: unknown,
  index: number
): ValidationResult<CotizacionDetallePayload> {
  const item = asRecord(value)
  if (!item) {
    return { ok: false, message: `Detalle ${index + 1} invalido` }
  }

  const idProductoVariante = getPositiveInteger(item.idProductoVariante)
  if (!idProductoVariante) {
    return { ok: false, message: `Detalle ${index + 1}: idProductoVariante invalido` }
  }

  const cantidad = getPositiveInteger(item.cantidad)
  if (!cantidad) {
    return { ok: false, message: `Detalle ${index + 1}: cantidad invalida` }
  }

  const precioUnitario = getNonNegativeNumber(item.precioUnitario)
  if (precioUnitario === null) {
    return { ok: false, message: `Detalle ${index + 1}: precioUnitario invalido` }
  }

  const descuento =
    item.descuento === undefined ? 0 : getNonNegativeNumber(item.descuento)
  if (descuento === null) {
    return { ok: false, message: `Detalle ${index + 1}: descuento invalido` }
  }

  return {
    ok: true,
    data: {
      idProductoVariante,
      cantidad,
      precioUnitario,
      descuento,
    },
  }
}

export function normalizeCotizacionWritePayload(
  value: unknown
): ValidationResult<CotizacionWritePayload> {
  const payload = asRecord(value)
  if (!payload) {
    return { ok: false, message: "Body invalido o vacio" }
  }

  const idSucursal = getPositiveInteger(payload.idSucursal)
  if (!idSucursal) {
    return { ok: false, message: "idSucursal invalido" }
  }

  const idCliente = getPositiveInteger(payload.idCliente)
  if (!idCliente) {
    return { ok: false, message: "idCliente invalido" }
  }

  const rawDetalles = Array.isArray(payload.detalles) ? payload.detalles : null
  if (!rawDetalles || rawDetalles.length === 0) {
    return { ok: false, message: "La cotizacion debe incluir al menos un detalle" }
  }

  const detalles: CotizacionDetallePayload[] = []
  for (const [index, item] of rawDetalles.entries()) {
    const normalizedDetalle = normalizeCotizacionDetalle(item, index)
    if (!normalizedDetalle.ok) {
      return normalizedDetalle
    }

    detalles.push(normalizedDetalle.data)
  }

  const igvPorcentaje =
    payload.igvPorcentaje === undefined || payload.igvPorcentaje === null
      ? undefined
      : getNonNegativeNumber(payload.igvPorcentaje)
  if (
    payload.igvPorcentaje !== undefined &&
    payload.igvPorcentaje !== null &&
    igvPorcentaje === null
  ) {
    return { ok: false, message: "igvPorcentaje invalido" }
  }

  const descuentoTotal =
    payload.descuentoTotal === undefined
      ? undefined
      : payload.descuentoTotal === null
        ? null
        : getNonNegativeNumber(payload.descuentoTotal)
  if (
    payload.descuentoTotal !== undefined &&
    payload.descuentoTotal !== null &&
    descuentoTotal === null
  ) {
    return { ok: false, message: "descuentoTotal invalido" }
  }

  return {
    ok: true,
    data: {
      idSucursal,
      idCliente,
      ...(typeof igvPorcentaje === "number" ? { igvPorcentaje } : {}),
      ...(descuentoTotal !== undefined ? { descuentoTotal } : {}),
      tipoDescuento: getTrimmedString(payload.tipoDescuento)?.toUpperCase() ?? null,
      observacion: getTrimmedString(payload.observacion) ?? null,
      detalles,
    },
  }
}
