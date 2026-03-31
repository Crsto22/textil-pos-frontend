import type { MonedaCodigo, SunatEstado, TipoComprobante } from "@/lib/types/venta"

export type TipoDescuentoCotizacion = "MONTO" | "PORCENTAJE" | (string & {})
export const COTIZACION_ESTADOS = ["ACTIVA", "CONVERTIDA"] as const
export const COTIZACION_ESTADOS_EDITABLES = ["ACTIVA"] as const

export type EstadoCotizacionBase = (typeof COTIZACION_ESTADOS)[number]
export type EstadoCotizacion = EstadoCotizacionBase | (string & {})
export type EstadoCotizacionEditable = (typeof COTIZACION_ESTADOS_EDITABLES)[number]

export interface CotizacionDetalleRequest {
  idProductoVariante: number
  cantidad: number
  precioUnitario: number
  descuento: number
}

export interface CotizacionCreateRequest {
  idSucursal: number
  idCliente: number
  igvPorcentaje?: number | null
  descuentoTotal?: number | null
  tipoDescuento?: TipoDescuentoCotizacion | null
  observacion?: string | null
  detalles: CotizacionDetalleRequest[]
}

export interface CotizacionEstadoUpdateRequest {
  estado: EstadoCotizacionEditable
}

export interface CotizacionDetalleResponse {
  idCotizacionDetalle: number
  idProductoVariante: number
  idProducto: number
  nombreProducto: string
  sku: string | null
  precioOferta: number | null
  ofertaInicio: string | null
  ofertaFin: string | null
  idColor: number | null
  color: string | null
  idTalla: number | null
  talla: string | null
  cantidad: number
  precioUnitario: number
  descuento: number
  subtotal: number
}

export interface CotizacionResponse {
  idCotizacion: number
  fecha: string
  serie: string
  correlativo: number
  igvPorcentaje: number
  subtotal: number
  descuentoTotal: number
  tipoDescuento: TipoDescuentoCotizacion | null
  igv: number
  total: number
  estado: EstadoCotizacion
  observacion: string | null
  idCliente: number | null
  nombreCliente: string
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  detalles: CotizacionDetalleResponse[]
}

export interface CotizacionWriteResponse {
  idCotizacion: number
  fecha?: string
  serie: string
  correlativo: number
  igvPorcentaje?: number
  subtotal?: number
  descuentoTotal?: number
  tipoDescuento?: TipoDescuentoCotizacion | null
  igv?: number
  total?: number
  estado?: EstadoCotizacion
  observacion?: string | null
  idCliente?: number | null
  nombreCliente?: string
  idUsuario?: number | null
  nombreUsuario?: string
  idSucursal?: number | null
  nombreSucursal?: string
  detalles?: CotizacionDetalleResponse[]
}

export interface CotizacionConvertirPagoRequest {
  idMetodoPago: number
  monto: number
  codigoOperacion: string | null
}

export interface CotizacionConvertirVentaRequest {
  tipoComprobante?: TipoComprobante | null
  pagos: CotizacionConvertirPagoRequest[]
}

export interface CotizacionConvertirVentaDetalle {
  descripcion: string
  unidadMedida: string
  codigoTipoAfectacionIgv: string
  igvDetalle: number
  totalDetalle: number
}

export interface CotizacionConvertirVentaPago {
  idMetodoPago: number
  monto: number
  codigoOperacion: string | null
}

export interface CotizacionConvertirVentaResumen {
  idVenta: number
  tipoComprobante: TipoComprobante
  serie: string
  correlativo: number
  moneda: MonedaCodigo
  sunatEstado: SunatEstado | null
  detalles: CotizacionConvertirVentaDetalle[]
  pagos: CotizacionConvertirVentaPago[]
}

export interface CotizacionConvertirVentaResponse {
  message: string
  idCotizacion: number
  estadoCotizacion: EstadoCotizacion
  idVenta: number
  venta: CotizacionConvertirVentaResumen
  sunatEstado?: SunatEstado | null
  sunatAutoDispatchTriggered?: boolean
  sunatAutoDispatchError?: string | null
}

export interface CotizacionHistorial {
  idCotizacion: number
  fecha: string
  serie: string
  correlativo: number
  total: number
  estado: EstadoCotizacion
  idCliente: number | null
  nombreCliente: string
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  items: number
}

export interface CotizacionHistorialPageResponse {
  content: CotizacionHistorial[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export type CotizacionListadoPeriodo =
  | "HOY"
  | "AYER"
  | "SEMANA"
  | "MES"
  | "FECHA"
  | "RANGO"

export type CotizacionListadoPeriodoBase = Exclude<CotizacionListadoPeriodo, "RANGO">

export interface CotizacionHistorialFilters {
  search: string
  estado: "TODOS" | string
  idUsuario: number | null
  idSucursal: number | null
  periodo: CotizacionListadoPeriodoBase
  usarRangoFechas: boolean
  fecha: string
  fechaDesde: string
  fechaHasta: string
}
