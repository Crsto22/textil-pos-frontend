// Tipos para el modulo de Stock por Sucursal

export interface SucursalStock {
  idSucursalStock: number
  idSucursal: number
  nombreSucursal: string
  tipoSucursal: string
  idProductoVariante: number
  idProducto: number
  producto: string
  sku: string | null
  codigoBarras: string | null
  color: string
  talla: string
  cantidad: number
  precio: number
  estadoVariante: string
}

export interface SucursalStockAjustarRequest {
  idSucursal: number
  idProductoVariante: number
  cantidad: number
  motivo: string
}
