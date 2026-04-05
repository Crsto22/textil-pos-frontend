// Tipos para el modulo de Historial de Stock

export interface HistorialStock {
  idHistorial: number
  fecha: string
  tipoMovimiento: string
  motivo: string | null
  idProductoVariante: number
  idProducto: number
  producto: string
  sku: string | null
  codigoBarras: string | null
  color: string
  talla: string
  idSucursal: number
  nombreSucursal: string
  tipoSucursal: string
  idUsuario: number
  nombreUsuario: string
  cantidad: number
  stockAnterior: number
  stockNuevo: number
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}
