export type ProductoReporteFiltro =
  | "HOY"
  | "ULT_7_DIAS"
  | "ULT_14_DIAS"
  | "ULT_30_DIAS"
  | "ULT_12_MESES"

export interface ProductoReporteFilters {
  filtro: ProductoReporteFiltro
  idSucursal: number | null
}

export interface ProductoReporteKpis {
  productosActivos: number
  variantesActivas: number
  variantesSinStock: number
  rotacionPromedio: number
}

export interface ProductoReporteTopProducto {
  idProducto: number | null
  producto: string
  idProductoVariante: number | null
  variante: string | null
  color: string | null
  talla: string | null
  idSucursal: number | null
  nombreSucursal: string | null
  unidadesVendidas: number
  montoVendido: number
}

export interface ProductoReporteHeatmapItem {
  idColor: number | null
  color: string
  codigoColor: string | null
  idTalla: number | null
  talla: string
  unidadesVendidas: number
  montoVendido: number
}

export interface ProductoReporteCategoriaItem {
  idCategoria: number | null
  categoria: string
  unidadesVendidas: number
  montoVendido: number
}

export interface ProductoReporteResponse {
  filtro: ProductoReporteFiltro
  desde: string
  hasta: string
  idSucursal: number | null
  nombreSucursal: string | null
  kpis: ProductoReporteKpis
  topProductosPorMonto: ProductoReporteTopProducto[]
  topProductosPorUnidades: ProductoReporteTopProducto[]
  heatmapVentasPorTallaColor: ProductoReporteHeatmapItem[]
  ventasPorCategoria: ProductoReporteCategoriaItem[]
}
