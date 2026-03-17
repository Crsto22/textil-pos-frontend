import type { Color } from "@/lib/types/color"
import type { Talla } from "@/lib/types/talla"

export const MAX_MEDIA_PER_COLOR = 5
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export interface ProductoCreateFormState {
  idSucursal: number | null
  idCategoria: number | null
  nombre: string
  descripcion: string
}

export interface ListResponse<T> {
  content?: T[]
  totalPages?: number
  message?: string
}

export interface MediaItem {
  id: string
  file: File | null
  fileName: string
  previewUrl: string
  url?: string
  urlThumb?: string
  idColorImagen?: number
}

export interface VariantReadonlyOfferInfo {
  precioBase: number
  precioOferta: number
  ofertaInicio: string | null
  ofertaFin: string | null
}

export interface VariantValues {
  idProductoVariante?: number | null
  sku: string
  precio: string
  precioMayor: string
  stock: string
}

export interface VariantRow {
  key: string
  idProductoVariante?: number | null
  color: Color
  talla: Talla
  sku: string
  precio: string
  precioMayor: string
  stock: string
  readonlyOffer?: VariantReadonlyOfferInfo | null
}

export type VariantEditableField = "sku" | "precio" | "precioMayor" | "stock"
