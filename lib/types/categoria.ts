// Tipos para el modulo de Categorias

export interface Categoria {
  idCategoria: number
  nombreCategoria: string
  descripcion: string
  estado: string
  fechaRegistro: string
  idSucursal: number | null
  nombreSucursal: string
}

export interface CategoriaCreateRequest {
  nombreCategoria: string
  descripcion: string
  idSucursal?: number | null
}

export interface CategoriaUpdateRequest {
  nombreCategoria: string
  descripcion: string
  idSucursal?: number | null
}

export interface CategoriaDeleteResponse {
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
