// Tipos para el modulo de Productos

export interface Producto {
  idProducto: number
  sku: string
  nombre: string
  descripcion: string
  estado: string
  fechaCreacion: string
  codigoExterno: string
  idCategoria: number | null
  nombreCategoria: string
  idSucursal: number | null
  nombreSucursal: string
}

export interface ProductoResumenImagen {
  url: string
  urlThumb: string
  orden: number
  esPrincipal: boolean
}

export interface ProductoResumenColor {
  colorId: number
  nombre: string
  hex: string
  imagenPrincipal: ProductoResumenImagen | null
  tallas: ProductoResumenTalla[]
}

export interface ProductoResumenTalla {
  tallaId: number
  nombre: string
}

export interface ProductoResumen extends Producto {
  precioMin?: number | null
  precioMax?: number | null
  colores: ProductoResumenColor[]
}

export interface ProductoCreateRequest {
  idSucursal?: number | null
  idCategoria: number | null
  sku: string
  nombre: string
  descripcion: string
  codigoExterno: string
}

export interface ProductoVarianteCreateRequest {
  colorId: number
  tallaId: number
  precio: number
  stock: number
}

export interface ProductoImagenCreateRequest {
  colorId: number
  orden: number
  esPrincipal?: boolean
  url: string
  urlThumb: string
}

export interface ProductoInsertarCompletoRequest {
  idSucursal: number
  idCategoria: number
  sku: string
  nombre: string
  descripcion?: string
  codigoExterno?: string
  variantes: ProductoVarianteCreateRequest[]
  imagenes: ProductoImagenCreateRequest[]
}

export interface ProductoImagenUploadResponseItem {
  url: string
  urlThumb: string
  ordenSugerido: number
}

export interface ProductoImagenesUploadResponse {
  colorId: number
  imagenes: ProductoImagenUploadResponseItem[]
}

export interface ProductoInsertarCompletoResponse {
  producto: Producto
  variantes: number
  imagenes: number
}

export interface ProductoUpdateRequest {
  idSucursal?: number | null
  idCategoria: number | null
  sku: string
  nombre: string
  descripcion: string
  codigoExterno: string
}

export interface ProductoDeleteResponse {
  message: string
}

/**
 * Respuesta paginada generica del backend (Spring Boot Page<T>).
 */
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
