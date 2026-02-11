// Tipos para el módulo de Tallas

export interface Talla {
  idTalla: number
  nombre: string
  estado: string
}

/**
 * Respuesta paginada genérica del backend (Spring Boot Page<T>).
 * Reutilizable para cualquier endpoint paginado.
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
