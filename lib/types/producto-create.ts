import type { Color } from "@/lib/types/color"
import type { Talla } from "@/lib/types/talla"

export const MAX_MEDIA_PER_COLOR = 5
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export interface ProductoCreateFormState {
  idSucursal: number | null
  idCategoria: number | null
  nombre: string
  sku: string
  descripcion: string
  codigoExterno: string
}

export interface ListResponse<T> {
  content?: T[]
  totalPages?: number
  message?: string
}

export interface MediaItem {
  id: string
  file: File
  fileName: string
  previewUrl: string
}

export interface VariantValues {
  precio: string
  stock: string
}

export interface VariantRow {
  key: string
  color: Color
  talla: Talla
  precio: string
  stock: string
}
