import type { PageResponse, ProductoDetalleVariante } from "@/lib/types/producto"

export interface ProductoVarianteOferta extends ProductoDetalleVariante {
  productoId: number
  productoNombre: string
  sucursalId: number | null
  sucursalNombre: string | null
  imageUrl: string | null
}

export type ProductoVarianteOfertaPageResponse = PageResponse<ProductoVarianteOferta>

export interface ProductoVarianteOfertaLoteItemRequest {
  idProductoVariante: number
  precioOferta: number | null
  ofertaInicio: string | null
  ofertaFin: string | null
}

export interface ProductoVarianteOfertaLoteRequest {
  items: ProductoVarianteOfertaLoteItemRequest[]
}

export interface OfertaFormDraft {
  precioOfertaInput: string
  ofertaInicioInput: string
  ofertaFinInput: string
}

export interface OfertaBatchDraftItem extends ProductoVarianteOfertaLoteItemRequest {
  productoId: number
  productoNombre: string
  sku: string
  colorNombre: string
  tallaNombre: string
  imageUrl?: string | null
  precio: number
  modo: "CREAR" | "ACTUALIZAR"
}
