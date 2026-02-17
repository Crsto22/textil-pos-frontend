// Tipos para el modulo de Colores

export interface Color {
  idColor: number
  nombre: string
  codigo: string
  estado: string
}

export interface ColorCreateRequest {
  nombre: string
  codigo: string
}

export interface ColorUpdateRequest {
  nombre: string
  codigo: string
}

export interface ColorDeleteResponse {
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
