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
