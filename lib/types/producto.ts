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

export interface ProductoCreateRequest {
  idSucursal?: number | null
  idCategoria: number | null
  sku: string
  nombre: string
  descripcion: string
  codigoExterno: string
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
