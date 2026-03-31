import type {
  CotizacionDetalleResponse,
  CotizacionResponse,
  EstadoCotizacion,
  TipoDescuentoCotizacion,
} from "@/lib/types/cotizacion"

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
        ofertaInicio: typeof data.ofertaInicio === "string" ? data.ofertaInicio : null,
        ofertaFin: typeof data.ofertaFin === "string" ? data.ofertaFin : null,
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

export function normalizeCotizacionResponse(value: unknown): CotizacionResponse | null {
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

export function getCotizacionErrorMessage(payload: unknown, fallbackMessage: string): string {
  const message =
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
      ? payload.message
      : payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
        ? payload.error
        : fallbackMessage

  const normalizedMessage = message.trim().toLowerCase()
  if (normalizedMessage.includes("no existe configuracion activa de cotizacion para la sucursal")) {
    return "La sucursal seleccionada no tiene una configuracion activa de cotizacion. Configurala en Configuracion > Comprobantes."
  }

  return message
}
