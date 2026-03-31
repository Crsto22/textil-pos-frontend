export type ClienteReporteFiltro =
  | "HOY"
  | "ULT_7_DIAS"
  | "ULT_14_DIAS"
  | "ULT_30_DIAS"
  | "ULT_12_MESES"

export interface ClienteReporteFilters {
  filtro: ClienteReporteFiltro
  idSucursal: number | null
}

export interface ClienteReporteKpis {
  clientesActivos: number
  clientesNuevosMes: number
  recurrenciaPct: number
}

export interface ClienteReporteTopCliente {
  idCliente: number | null
  cliente: string
  tipoDocumento: string | null
  nroDocumento: string | null
  compras: number
  totalGastado: number
  ticketPromedio: number
  ultimaCompra: string | null
}

export interface ClienteReporteCohorteItem {
  cohorteSemana: string
  inicioSemana: string
  clientesNuevos: number
  clientesQueRecompran: number
  tasaRecompraPct: number
}

export interface ClienteReporteRfmItem {
  idCliente: number | null
  cliente: string
  tipoDocumento: string | null
  nroDocumento: string | null
  ultimaCompra: string | null
  recenciaDias: number
  frecuencia: number
  monto: number
}

export interface ClienteReporteResponse {
  filtro: ClienteReporteFiltro
  desde: string
  hasta: string
  idSucursal: number | null
  nombreSucursal: string | null
  kpis: ClienteReporteKpis
  topClientesPorMonto: ClienteReporteTopCliente[]
  topClientesPorCompras: ClienteReporteTopCliente[]
  cohorteSemanal: ClienteReporteCohorteItem[]
  segmentacionRfm: ClienteReporteRfmItem[]
}
