export type TipoComprobante = "NOTA DE VENTA" | "BOLETA" | "FACTURA" | (string & {})
export type MonedaCodigo = "PEN" | "USD" | (string & {})
export type FormaPagoVenta = "CONTADO" | "CREDITO" | (string & {})
export type TipoDescuentoVenta = "PORCENTAJE" | "MONTO" | null
export type VentaAnularMotivoCodigo = "01" | (string & {})
export type VentaNotaCreditoMotivoCodigo = "02" | "03" | "06" | "07" | (string & {})
export type VentaTipoAnulacion = "NOTA_CREDITO" | "COMUNICACION_BAJA" | (string & {})
export type SunatEstado =
  | "NO_APLICA"
  | "PENDIENTE_ENVIO"
  | "ENVIANDO"
  | "PENDIENTE_CDR"
  | "ERROR_TRANSITORIO"
  | "ERROR_DEFINITIVO"
  | "ACEPTADO"
  | "OBSERVADO"
  | "RECHAZADO"
  | "PENDIENTE"
  | "ERROR"
  | (string & {})

export interface VentaCreateDetalleRequest {
  idProductoVariante: number
  descripcion?: string | null
  cantidad: number
  unidadMedida?: string | null
  codigoTipoAfectacionIgv?: string | null
  precioUnitario: number
  descuento: number
}

export interface VentaCreatePagoRequest {
  idMetodoPago: number
  monto: number
  codigoOperacion?: string | null
}

export interface VentaCreateRequest {
  idSucursal: number
  idCanalVenta?: number | null
  idCliente: number | null
  tipoComprobante: TipoComprobante
  serie: string
  moneda?: MonedaCodigo | null
  formaPago?: FormaPagoVenta | null
  igvPorcentaje?: number | null
  descuentoTotal?: number | null
  tipoDescuento?: TipoDescuentoVenta
  detalles: VentaCreateDetalleRequest[]
  pagos: VentaCreatePagoRequest[]
}

export interface VentaInsertPagoResponse {
  idPago: number
  idMetodoPago: number
  metodoPago: string
  monto: number
  codigoOperacion: string | null
  fecha: string | null
}

export interface VentaInsertResponse {
  idVenta: number
  sunatEstado: SunatEstado | null
  sunatXmlNombre: string | null
  sunatZipNombre: string | null
  sunatCdrNombre: string | null
  pagos?: VentaInsertPagoResponse[]
}

export interface VentaHistorial {
  idVenta: number
  fecha: string
  tipoComprobante: TipoComprobante
  serie: string
  correlativo: number
  moneda: MonedaCodigo
  total: number
  estado: string
  sunatEstado: SunatEstado | null
  sunatBajaEstado: string | null
  idCliente: number | null
  nombreCliente: string
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  idCanalVenta: number | null
  nombreCanalVenta: string | null
  plataformaCanalVenta: string | null
  items: number
  pagos: number
}

export interface VentaBajaInfo {
  idVenta: number
  tipoComprobante: string
  serie: string
  correlativo: number
  nombreCliente: string
  moneda: string
  total: number
}

export interface VentaDetalleItem {
  idVentaDetalle: number
  idProductoVariante: number
  idProducto: number
  nombreProducto: string
  descripcion: string
  sku: string | null
  precioOferta: number | null
  ofertaInicio: string | null
  ofertaFin: string | null
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

export interface VentaDetallePago {
  idPago: number
  idMetodoPago: number
  nombreMetodoPago: string
  monto: number
  codigoOperacion: string | null
  fecha: string | null
}

export interface VentaDetalleResponse {
  idVenta: number
  fecha: string
  tipoComprobante: TipoComprobante
  serie: string
  correlativo: number
  moneda: MonedaCodigo
  igvPorcentaje: number
  subtotal: number
  descuentoTotal: number
  tipoDescuento: string | null
  igv: number
  total: number
  estado: string
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
  sunatBajaEstado: string | null
  sunatBajaCodigo: string | null
  sunatBajaMensaje: string | null
  sunatBajaTicket: string | null
  sunatBajaTipo: string | null
  sunatBajaLoteId: number | null
  sunatBajaSolicitadaAt: string | null
  sunatBajaRespondidaAt: string | null
  idCliente: number | null
  nombreCliente: string
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  idCanalVenta: number | null
  nombreCanalVenta: string | null
  plataformaCanalVenta: string | null
  formaPago: FormaPagoVenta | null
  detalles: VentaDetalleItem[]
  pagos: VentaDetallePago[]
}

export interface VentaSunatRetryResponse {
  idVenta: number
  sunatEstado: SunatEstado | null
  sunatCodigo: string | null
  sunatMensaje: string | null
  sunatXmlNombre: string | null
  sunatZipNombre: string | null
  sunatCdrNombre: string | null
}

export interface VentaAnularRequest {
  codigoMotivo: VentaAnularMotivoCodigo
  descripcionMotivo: string
  serie?: string
}

export interface VentaAnularResponse {
  idVenta: number
  numeroVenta: string | null
  tipoComprobanteVenta: TipoComprobante | null
  estadoVenta: string | null
  tipoAnulacion: VentaTipoAnulacion | null
  motivoAnulacion: string | null
  fechaAnulacion: string | null
  stockDevuelto: boolean
  idNotaCredito: number | null
  numeroNotaCredito: string | null
  tipoComprobanteNotaCredito: string | null
  sunatEstadoNotaCredito: SunatEstado | null
  sunatCodigoNotaCredito: string | null
  sunatMensajeNotaCredito: string | null
  sunatBajaEstado: string | null
  sunatBajaMensaje: string | null
  sunatBajaTicket: string | null
  sunatBajaLote: string | null
  message: string | null
}

export interface VentaAnularResult {
  ok: boolean
  message: string
  response: VentaAnularResponse | null
}

export interface VentaNotaCreditoItemRequest {
  idVentaDetalle: number
  cantidad: number
}

export interface VentaNotaCreditoRequest {
  serie: string
  codigoMotivo: VentaNotaCreditoMotivoCodigo
  descripcionMotivo: string
  items?: VentaNotaCreditoItemRequest[]
}

export interface VentaHistorialPageResponse {
  content: VentaHistorial[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface VentaHistorialFilters {
  search: string
  estado: "TODOS" | string
  comprobante: "TODOS" | TipoComprobante
  idUsuario: number | null
  idSucursal: number | null
  idCanalVenta: number | null
  idCliente: number | null
  periodo: VentaListadoPeriodoBase
  usarRangoFechas: boolean
  fecha: string
  fechaDesde: string
  fechaHasta: string
}

export type VentaListadoPeriodo =
  | "HOY"
  | "AYER"
  | "SEMANA"
  | "MES"
  | "FECHA"
  | "RANGO"

export type VentaListadoPeriodoBase = Exclude<VentaListadoPeriodo, "RANGO">

export type VentaReporteAgrupacion = "DIA" | "SEMANA" | "MES"

export interface VentaReportePeriodo {
  periodo: string
  cantidadVentas: number
  montoTotal: number
  ticketPromedio: number
}

export interface VentaReporteDetalle {
  idVenta: number
  fecha: string
  tipoComprobante: TipoComprobante
  serie: string
  correlativo: number
  estado: string
  idCliente: number | null
  nombreCliente: string
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  subtotal: number
  descuentoTotal: number
  igv: number
  total: number
}

export interface VentaReporteCliente {
  idCliente: number | null
  nombreCliente: string
  cantidadVentas: number
  montoTotal: number
  ticketPromedio: number
}

export interface VentaReporteResponse {
  agrupacion: VentaReporteAgrupacion
  desde: string
  hasta: string
  idSucursal: number | null
  nombreSucursal: string | null
  incluirAnuladas: boolean
  montoTotal: number
  cantidadVentas: number
  ticketPromedio: number
  periodos: VentaReportePeriodo[]
  detalleVentas: VentaReporteDetalle[]
  clientes: VentaReporteCliente[]
}
