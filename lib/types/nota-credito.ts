import type { MonedaCodigo, SunatEstado } from "@/lib/types/venta"

export type NotaCreditoMotivoCodigo = "02" | "03" | "06" | "07" | (string & {})

export interface NotaCreditoHistorial {
  idNotaCredito: number
  fecha: string
  tipoComprobante: string
  serie: string
  correlativo: number
  moneda: MonedaCodigo
  total: number
  estado: string
  sunatEstado: SunatEstado | null
  sunatBajaEstado: string | null
  sunatBajaCodigo: string | null
  sunatBajaMensaje: string | null
  sunatBajaTicket: string | null
  sunatBajaLoteId: number | null
  sunatBajaMotivo: string | null
  sunatBajaSolicitadaAt: string | null
  sunatBajaRespondidaAt: string | null
  codigoMotivo: NotaCreditoMotivoCodigo
  descripcionMotivo: string
  stockDevuelto: boolean
  idVentaReferencia: number | null
  numeroVentaReferencia: string
  tipoComprobanteVentaReferencia: string
  idCliente: number | null
  nombreCliente: string
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  items: number
}

export interface NotaCreditoBajaInfo {
  idNotaCredito: number
  tipoComprobante: string
  serie: string
  correlativo: number
  nombreCliente: string
  moneda: string
  total: number
}

export interface NotaCreditoBajaRequest {
  codigoMotivo: "01" | (string & {})
  descripcionMotivo: string
}

export interface NotaCreditoBajaResult {
  ok: boolean
  message: string
  response: unknown | null
}

export interface NotaCreditoDetalleItem {
  idNotaCreditoDetalle: number
  idVentaDetalleReferencia: number | null
  idProductoVariante: number
  idProducto: number
  nombreProducto: string
  descripcion: string
  sku: string | null
  idColor: number | null
  color: string | null
  idTalla: number | null
  talla: string | null
  cantidad: number
  unidadMedida: string
  codigoTipoAfectacionIgv: string
  precioUnitario: number
  descuento: number
  igvDetalle: number
  subtotal: number
  totalDetalle: number
}

export interface NotaCreditoDetalleResponse {
  idNotaCredito: number
  fecha: string
  tipoComprobante: string
  serie: string
  correlativo: number
  numeroNotaCredito: string | null
  moneda: MonedaCodigo
  codigoMotivo: NotaCreditoMotivoCodigo
  descripcionMotivo: string
  tipoDocumentoRef: string | null
  serieRef: string | null
  correlativoRef: number | null
  numeroDocumentoReferencia: string | null
  idVentaReferencia: number | null
  numeroVentaReferencia: string | null
  tipoComprobanteVentaReferencia: string | null
  igvPorcentaje: number
  subtotal: number
  descuentoTotal: number
  igv: number
  total: number
  estado: string
  stockDevuelto: boolean
  sunatEstado: SunatEstado | null
  sunatCodigo: string | null
  sunatMensaje: string | null
  sunatHash: string | null
  sunatTicket: string | null
  sunatXmlNombre: string | null
  sunatZipNombre: string | null
  sunatCdrNombre: string | null
  sunatEnviadoAt: string | null
  sunatRespondidoAt: string | null
  tipoAnulacion: string | null
  motivoAnulacion: string | null
  anuladoAt: string | null
  idUsuarioAnulacion: number | null
  nombreUsuarioAnulacion: string | null
  sunatBajaEstado: string | null
  sunatBajaCodigo: string | null
  sunatBajaMensaje: string | null
  sunatBajaTicket: string | null
  sunatBajaTipo: string | null
  sunatBajaLoteId: number | null
  sunatBajaLote: string | null
  sunatBajaSolicitadaAt: string | null
  sunatBajaRespondidaAt: string | null
  idCliente: number | null
  tipoDocumentoCliente: string | null
  nroDocumentoCliente: string | null
  nombreCliente: string
  telefonoCliente: string | null
  correoCliente: string | null
  direccionCliente: string | null
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  idEmpresa: number | null
  nombreEmpresa: string | null
  rucEmpresa: string | null
  detalles: NotaCreditoDetalleItem[]
}

export interface NotaCreditoHistorialPageResponse {
  content: NotaCreditoHistorial[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export type NotaCreditoListadoPeriodo =
  | "HOY"
  | "AYER"
  | "SEMANA"
  | "MES"
  | "FECHA"
  | "RANGO"

export type NotaCreditoListadoPeriodoBase = Exclude<NotaCreditoListadoPeriodo, "RANGO">

export interface NotaCreditoHistorialFilters {
  search: string
  idVenta: number | null
  estado: "TODOS" | string
  idUsuario: number | null
  idCliente: number | null
  codigoMotivo: "TODOS" | NotaCreditoMotivoCodigo
  periodo: NotaCreditoListadoPeriodoBase
  fecha: string
  fechaDesde: string
  fechaHasta: string
  usarRangoFechas: boolean
  idSucursal: number | null
}
