export type UsuarioReporteFiltro =
  | "HOY"
  | "ULT_7_DIAS"
  | "ULT_14_DIAS"
  | "ULT_30_DIAS"
  | "ULT_12_MESES"

export interface UsuarioReporteFilters {
  filtro: UsuarioReporteFiltro
  idSucursal: number | null
}

export interface UsuarioReporteKpiUsuarioItem {
  idUsuario: number | null
  usuario: string
  rol: string | null
  ventas: number
  monto: number
  ticketPromedio: number
}

export interface UsuarioReporteAnulacionItem {
  idUsuario: number | null
  usuario: string
  rol: string | null
  anulaciones: number
  montoAnulado: number
}

export interface UsuarioReporteEvolucionPunto {
  fecha: string
  ventas: number
  monto: number
  anulaciones: number
  montoAnulado: number
}

export interface UsuarioReporteEvolucionItem {
  idUsuario: number | null
  usuario: string
  rol: string | null
  puntos: UsuarioReporteEvolucionPunto[]
}

export interface UsuarioReporteResponse {
  filtro: UsuarioReporteFiltro
  desde: string
  hasta: string
  idSucursal: number | null
  nombreSucursal: string | null
  kpisPorUsuario: UsuarioReporteKpiUsuarioItem[]
  rankingPorMonto: UsuarioReporteKpiUsuarioItem[]
  rankingPorComprobantes: UsuarioReporteKpiUsuarioItem[]
  controlAnulacionesPorUsuario: UsuarioReporteAnulacionItem[]
  evolucionDiariaPorUsuario: UsuarioReporteEvolucionItem[]
}
