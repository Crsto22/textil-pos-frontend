// Tipos para el modulo de Productos

export interface Producto {
  idProducto: number
  sku: string
  nombre: string
  descripcion: string
  estado: string
  fechaCreacion: string
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
  hex: string | null
  imagenPrincipal: ProductoResumenImagen | null
  tallas: ProductoResumenTalla[]
}

export interface ProductoResumenTalla {
  idProductoVariante?: number | null
  tallaId: number
  nombre: string
  sku?: string | null
  precio?: number | null
  precioOferta?: number | null
  stock?: number | null
  estado?: string | null
}

export interface ProductoResumen extends Producto {
  precioMin?: number | null
  precioMax?: number | null
  colores: ProductoResumenColor[]
}

export interface ProductoCreateRequest {
  idSucursal?: number | null
  idCategoria: number | null
  nombre: string
  descripcion: string
}

export interface ProductoVarianteCreateRequest {
  colorId: number
  tallaId: number
  sku: string
  precio: number
  precioOferta?: number | null
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
  nombre: string
  descripcion?: string
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

export interface ProductoImportResponse {
  filasProcesadas: number
  productosCreados: number
  productosActualizados: number
  variantesGuardadas: number
  categoriasCreadas?: number
  coloresCreados: number
  tallasCreadas: number
}

export interface ProductoImportacionHistorial {
  idImportacion: number
  idUsuario: number | null
  nombreUsuario: string
  idSucursal: number | null
  nombreSucursal: string
  nombreArchivo: string
  tamanoBytes: number
  filasProcesadas: number
  productosCreados: number
  productosActualizados: number
  variantesGuardadas: number
  categoriasCreadas: number
  coloresCreados: number
  tallasCreadas: number
  estado: string
  mensajeError: string | null
  duracionMs: number | null
  createdAt: string
}

export interface ProductoInsertarCompletoResponse {
  producto: Producto
  variantes: number
  imagenes: number
}

export interface ProductoDetalleVariante {
  idProductoVariante: number
  sku: string
  colorId: number
  colorNombre: string
  colorHex: string
  tallaId: number
  tallaNombre: string
  precio: number
  precioOferta: number | null
  stock: number
  estado: string
}

export interface ProductoDetalleImagen {
  idColorImagen: number
  colorId: number
  colorNombre: string
  colorHex: string
  url: string
  urlThumb: string
  orden: number
  esPrincipal: boolean
  estado: string
}

export interface ProductoDetalleResponse {
  producto: Producto
  variantes: ProductoDetalleVariante[]
  imagenes: ProductoDetalleImagen[]
}

export interface ProductoActualizarCompletoResponse {
  producto: Producto
  variantes: number
  imagenes: number
}

export interface ProductoUpdateRequest {
  idSucursal?: number | null
  idCategoria: number | null
  nombre: string
  descripcion: string
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
