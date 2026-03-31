export type PagoListadoPeriodo =
  | "HOY"
  | "AYER"
  | "SEMANA"
  | "MES"
  | "FECHA"
  | "RANGO"

export type PagoListadoPeriodoBase = Exclude<PagoListadoPeriodo, "RANGO">

export interface PagoListado {
  idPago: number
  fecha: string
  monto: number
  codigoOperacion: string | null
  idMetodoPago: number | null
  metodoPago: string
  idVenta: number | null
  tipoComprobante: string
  serie: string
  correlativo: number
  idCliente: number | null
  nombreCliente: string
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  estadoVenta: string
}

export interface PagoFilters {
  search: string
  estadoVenta: "TODOS" | string
  idUsuario: number | null
  idMetodoPago: number | null
  idSucursal: number | null
  periodo: PagoListadoPeriodoBase
  usarRangoFechas: boolean
  fecha: string
  fechaDesde: string
  fechaHasta: string
}

export interface PagoPageResponse {
  content: PagoListado[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}
