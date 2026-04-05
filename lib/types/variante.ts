import type { PageResponse, StockSucursalVenta } from "@/lib/types/producto"

export interface VarianteResumenImagen {
  idColorImagen: number | null
  url: string
  urlThumb: string
  orden: number
  esPrincipal: boolean
  estado: string
}

export interface VarianteResumenCategoria {
  idCategoria: number | null
  nombreCategoria: string
}

export interface VarianteResumenSucursal {
  idSucursal: number | null
  nombreSucursal: string | null
}

export interface VarianteResumenProducto {
  idProducto: number
  nombre: string
  descripcion: string
  estado: string
  fechaCreacion: string
  categoria: VarianteResumenCategoria | null
  sucursal: VarianteResumenSucursal | null
}

export interface VarianteResumenColor {
  idColor: number | null
  nombre: string
  hex: string | null
}

export interface VarianteResumenTalla {
  idTalla: number | null
  nombre: string
}

export interface VarianteResumenItem {
  idProductoVariante: number
  sku: string | null
  codigoBarras: string | null
  estado: string
  stock: number | null
  stocksSucursalesVenta: StockSucursalVenta[]
  precio: number | null
  precioMayor: number | null
  precioOferta: number | null
  ofertaInicio: string | null
  ofertaFin: string | null
  precioVigente: number | null
  producto: VarianteResumenProducto
  color: VarianteResumenColor | null
  talla: VarianteResumenTalla | null
  imagenPrincipal: VarianteResumenImagen | null
  imagenes: VarianteResumenImagen[]
}

export interface VarianteUpdateRequest {
  colorId: number
  tallaId: number
  sku: string
  codigoBarras?: string | null
  precio: number
  precioMayor?: number | null
  stock: number
  precioOferta?: number | null
  ofertaInicio?: string | null
  ofertaFin?: string | null
}

export interface VarianteDeleteResponse {
  message: string
}

export type VarianteResumenPageResponse = PageResponse<VarianteResumenItem>

export interface VarianteCatalogoProducto {
  idProducto: number
  nombre: string
}

export interface VarianteCatalogoTalla {
  idTalla: number
  nombre: string
}

export interface VarianteCatalogoColor {
  idColor: number
  nombre: string
}

export interface VarianteCatalogoItem {
  idProductoVariante: number
  precio: number | null
  precioMayor: number | null
  precioOferta: number | null
  ofertaInicio: string | null
  ofertaFin: string | null
  estado: string
  activo: string | null
  deletedAt: string | null
  sku: string | null
  codigoBarras: string | null
  stock: number | null
  stocksSucursalesVenta: StockSucursalVenta[]
  sucursal: VarianteResumenSucursal | null
  producto: VarianteCatalogoProducto | null
  talla: VarianteCatalogoTalla | null
  color: VarianteCatalogoColor | null
}

export interface VariantePorProductoItem {
  idProductoVariante: number
  sku: string | null
  codigoBarras: string | null
  stock: number | null
  stocksSucursalesVenta: StockSucursalVenta[]
  sucursal: VarianteResumenSucursal | null
  producto: VarianteCatalogoProducto | null
}

export interface VarianteEscanearProducto {
  idProducto: number
  nombre: string
  descripcion: string
}

export interface VarianteEscanearColor {
  idColor: number
  nombre: string
  hex: string | null
}

export interface VarianteEscanearTalla {
  idTalla: number
  nombre: string
}

export interface VarianteEscanearImagen {
  url: string
  urlThumb: string
}

export interface VarianteEscanearResponse {
  idProductoVariante: number
  idSucursal: number
  codigoBarras: string
  sku: string | null
  stock: number
  estado: string
  precio: number
  precioMayor: number | null
  precioOferta: number | null
  ofertaInicio: string | null
  ofertaFin: string | null
  precioVigente: number
  producto: VarianteEscanearProducto
  color: VarianteEscanearColor
  talla: VarianteEscanearTalla
  imagenPrincipal: VarianteEscanearImagen | null
}
