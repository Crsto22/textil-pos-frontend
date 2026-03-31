export type DashboardFiltro =
  | "HOY"
  | "ULT_7_DIAS"
  | "ULT_14_DIAS"
  | "ULT_30_DIAS"
  | "ULT_12_MESES"

export interface DashboardFilters {
  filtro: DashboardFiltro
  idSucursal: number | null
}

export interface DashboardSalePoint {
  fecha: string
  monto: number
}

export interface DashboardPaymentIncome {
  metodoPago: string
  monto: number
}

export interface DashboardTopProduct {
  idProductoVariante: number | null
  producto: string
  color: string | null
  talla: string | null
  cantidadVendida: number
  stock: number | null
  sku: string | null
}

export interface DashboardComprobanteTipoItem {
  tipoComprobante: string
  cantidadComprobantes: number
  montoVendido: number
}

export interface DashboardEstadoItem {
  estado: string
  cantidadComprobantes: number
  montoTotal: number
}

export interface DashboardSucursalVentasItem {
  idSucursal: number | null
  sucursal: string
  cantidadComprobantes: number
  montoVendido: number
}

export interface DashboardStockCriticoItem {
  idProductoVariante: number | null
  producto: string
  color: string | null
  talla: string | null
  stock: number
  sku: string | null
}

export interface DashboardStockCritico {
  variantesAgotadas: number
  stockBajo: number
  agotados: DashboardStockCriticoItem[]
  prontosAgotarse: DashboardStockCriticoItem[]
}

export interface DashboardAdminKpis {
  ventasTotalesFiltro: number
  ventasDelDia: number
  ventasDelMes: number
  ticketPromedio: number
  comprobantesEmitidos: number
  comprobantesAnulados: number
  montoAnulado: number
  unidadesVendidas: number
  variantesVendidas: number
}

export interface DashboardAdminData {
  dashboard: "ADMIN"
  filtro: DashboardFiltro
  idSucursal: number | null
  nombreSucursal: string | null
  desde: string
  hasta: string
  ventasTotales: number
  productosVendidos: number
  ticketsEmitidos: number
  kpis: DashboardAdminKpis
  ingresosPorMetodoPago: DashboardPaymentIncome[]
  ventasPorFecha: DashboardSalePoint[]
  topProductosMasVendidos: DashboardTopProduct[]
  comprobantesPorTipo: DashboardComprobanteTipoItem[]
  distribucionPorEstado: DashboardEstadoItem[]
  ventasPorSucursal: DashboardSucursalVentasItem[]
  stockCritico: DashboardStockCritico
}

export interface DashboardVentasData {
  dashboard: "VENTAS"
  filtro: DashboardFiltro
  idSucursal: number | null
  nombreSucursal: string | null
  desde: string
  hasta: string
  misVentasTotales: number
  misProductosVendidos: number
  miPromedioVenta: number
  misCotizacionesAbiertas: number
  misVentasPorFecha: DashboardSalePoint[]
  topProductosMasVendidos: DashboardTopProduct[]
}

export interface DashboardAlmacenData {
  dashboard: "ALMACEN"
  filtro: DashboardFiltro
  idSucursal: number | null
  nombreSucursal: string | null
  desde: string
  hasta: string
  totalFisicoEnTienda: number
  variantesDisponibles: number
  variantesAgotadas: number
  stockBajo: number
  reposicionUrgente: DashboardStockCriticoItem[]
  topMayorSalida: DashboardTopProduct[]
}

export type DashboardData =
  | DashboardAdminData
  | DashboardVentasData
  | DashboardAlmacenData
