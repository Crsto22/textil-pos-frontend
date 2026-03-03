export type TipoComprobante = "TICKET" | "BOLETA" | "FACTURA" | (string & {})

export interface VentaHistorial {
  idVenta: number
  fecha: string
  tipoComprobante: TipoComprobante
  serie: string
  correlativo: number
  total: number
  estado: string
  idCliente: number | null
  nombreCliente: string
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  items: number
  pagos: number
}

export interface VentaDetalleItem {
  idVentaDetalle: number
  idProductoVariante: number
  idProducto: number
  nombreProducto: string
  sku: string | null
  codigoExterno: string | null
  idColor: number | null
  color: string | null
  idTalla: number | null
  talla: string | null
  cantidad: number
  precioUnitario: number
  descuento: number
  subtotal: number
}

export interface VentaDetallePago {
  idPago: number
  idMetodoPago: number
  metodoPago: string
  monto: number
  referencia: string | null
  fecha: string
}

export interface VentaDetalleResponse {
  idVenta: number
  fecha: string
  tipoComprobante: TipoComprobante
  serie: string
  correlativo: number
  igvPorcentaje: number
  subtotal: number
  descuentoTotal: number
  tipoDescuento: string | null
  igv: number
  total: number
  estado: string
  idCliente: number | null
  nombreCliente: string
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  detalles: VentaDetalleItem[]
  pagos: VentaDetallePago[]
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
  fechaDesde: string
  fechaHasta: string
}
