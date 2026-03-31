import type { PageResponse } from "@/lib/types/producto"

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
  nombreSucursal: string
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
}

export interface VarianteDeleteResponse {
  message: string
}

export type VarianteResumenPageResponse = PageResponse<VarianteResumenItem>

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
