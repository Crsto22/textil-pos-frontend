// Tipos para el módulo de Usuarios

export interface Usuario {
  idUsuario: number
  nombre: string
  apellido: string
  dni: string
  telefono: string
  correo: string
  rol: "ADMINISTRADOR" | "VENTAS" | string
  estado: "ACTIVO" | "INACTIVO" | string
  fechaCreacion: string
  idSucursal: number
  nombreSucursal: string
}

export interface UsuarioCreateRequest {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  password: string
  rol: string
  idSucursal: number
}

export interface UsuarioUpdateRequest {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  correo: string
  rol: string
  estado: string
  idSucursal: number
}

export const emptyCreate: UsuarioCreateRequest = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  email: "",
  password: "",
  rol: "VENTAS",
  idSucursal: 1,
}

export const emptyUpdate: UsuarioUpdateRequest = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  correo: "",
  rol: "VENTAS",
  estado: "ACTIVO",
  idSucursal: 1,
}

/**
 * Respuesta paginada genérica del backend (Spring Boot Page<T>).
 * Re-exportada desde talla.ts por conveniencia, pero también definida aquí
 * para que el módulo de usuarios sea autocontenido.
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
