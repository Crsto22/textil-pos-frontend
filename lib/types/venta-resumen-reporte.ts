export type VentaResumenReporteFiltro =
  | "HOY"
  | "ULT_7_DIAS"
  | "ULT_14_DIAS"
  | "ULT_30_DIAS"
  | "ULT_12_MESES"

export interface VentaResumenReporteFilters {
  filtro: VentaResumenReporteFiltro
  idSucursal: number | null
}

export interface VentaResumenReporteKpis {
  ventasDelDia: number
  ventasDelMes: number
  ticketPromedio: number
  cantidadComprobantes: number
}

export interface VentaResumenMontoPorDiaItem {
  fecha: string
  monto: number
}

export interface VentaResumenTipoComprobanteItem {
  tipoComprobante: string
  cantidadComprobantes: number
  montoVendido: number
}

export interface VentaResumenEstadoItem {
  estado: string
  cantidadComprobantes: number
  montoTotal: number
}

export interface VentaResumenSucursalItem {
  idSucursal: number | null
  sucursal: string
  cantidadComprobantes: number
  montoVendido: number
}

export interface VentaResumenReporteResponse {
  filtro: VentaResumenReporteFiltro
  desde: string
  hasta: string
  idSucursal: number | null
  nombreSucursal: string | null
  kpis: VentaResumenReporteKpis
  tendenciaMontoPorDia: VentaResumenMontoPorDiaItem[]
  ventasPorTipoComprobante: VentaResumenTipoComprobanteItem[]
  distribucionPorEstado: VentaResumenEstadoItem[]
  ventasPorSucursal: VentaResumenSucursalItem[]
}
