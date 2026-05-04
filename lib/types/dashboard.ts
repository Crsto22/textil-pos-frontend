export type DashboardFiltro =
  | "HOY"
  | "ULT_7_DIAS"
  | "ULT_14_DIAS"
  | "ULT_30_DIAS"
  | "TIEMPO_REAL"

export type DashboardGranularidad = "HORA" | "DIA" | "MES" | (string & {})

export interface DashboardFilters {
  filtro?: DashboardFiltro
  desde?: string
  hasta?: string
  idSucursal: number | null
}

export interface DashboardSalePoint {
  fecha: string
  etiqueta: string
  granularidad: DashboardGranularidad
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

export interface DashboardResumenMovimientos {
  totalMovimientos: number
  unidadesEntrada: number
  unidadesSalida: number
  unidadesAjuste: number
  unidadesReserva: number
  unidadesLiberacion: number
  trasladosEntrada: number
  unidadesTrasladoEntrada: number
  trasladosSalida: number
  unidadesTrasladoSalida: number
}

export interface DashboardMovimientoItem {
  fecha: string
  tipo: string
  motivo: string | null
  producto: string
  color: string | null
  talla: string | null
  cantidad: number
  stockAntes: number
  stockDespues: number
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
  resumenMovimientos: DashboardResumenMovimientos
  ultimosMovimientos: DashboardMovimientoItem[]
  topStockActual: DashboardTopProduct[]
}

export interface DashboardSistemaStorageCarpeta {
  carpeta: string
  existe: boolean
  bytes: number
  bytesLegible: string
  archivos: number
}

export interface DashboardSistemaStorage {
  basePath: string
  existe: boolean
  totalBytes: number
  totalLegible: string
  totalArchivos: number
  carpetas: DashboardSistemaStorageCarpeta[]
}

export interface DashboardSistemaDatabase {
  sizeMb: number
  tablesCount: number
  tablasMasPesadas: { tableName: string; sizeMb: number; rows: number }[]
}

export interface DashboardSistemaRuntime {
  applicationName: string
  javaVersion: string
  uptimeMs: number
  uptimeLegible: string
  processors: number
  memoryUsedBytes: number
  memoryUsedLegible: string
  memoryFreeBytes: number
  memoryFreeLegible: string
  memoryMaxBytes: number
  memoryMaxLegible: string
  memoryUsedPercent: number
}

export interface DashboardSistemaDisk {
  path: string
  totalBytes: number
  totalLegible: string
  usedBytes: number
  usedLegible: string
  freeBytes: number
  freeLegible: string
  freePercent: number
}

export interface DashboardSistemaSunatJob {
  idSunatJob: number
  estado: string
  tipoDocumento: string
  fechaCreacion: string
  fechaActualizacion: string
}

export interface DashboardSistemaSunatJobEstado {
  estado: string
  total: number
}

export interface DashboardSistemaSunat {
  totalJobs: number
  jobsNoFinalizados: number
  jobsPorEstado: DashboardSistemaSunatJobEstado[]
  ultimoJob: DashboardSistemaSunatJob | null
}

export interface DashboardSistemaUsuariosRol {
  rol: string
  total: number
}

export interface DashboardSistemaUsuarios {
  activos: number
  eliminados: number
  activosPorRol: DashboardSistemaUsuariosRol[]
}

export interface DashboardSistemaAlerta {
  componente: string
  estado: string
  mensaje: string
}

export interface DashboardSistemaData {
  dashboard: "SISTEMA"
  generadoEn: string
  storage: DashboardSistemaStorage
  database: DashboardSistemaDatabase
  runtime: DashboardSistemaRuntime
  disk: DashboardSistemaDisk
  sunat: DashboardSistemaSunat
  usuarios: DashboardSistemaUsuarios
  alertas: DashboardSistemaAlerta[]
}

export type DashboardData =
  | DashboardAdminData
  | DashboardVentasData
  | DashboardAlmacenData
  | DashboardSistemaData
