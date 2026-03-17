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
  precio: number
  precioMayor?: number | null
  stock: number
}

export interface VarianteDeleteResponse {
  message: string
}

export type VarianteResumenPageResponse = PageResponse<VarianteResumenItem>
