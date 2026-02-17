// Tipos para el modulo de Sucursales

export interface Sucursal {
  idSucursal: number
  nombre: string
  descripcion: string
  direccion: string
  telefono: string
  correo: string
  estado: "ACTIVO" | "INACTIVO" | string
  fechaCreacion: string
  idEmpresa: number
  nombreEmpresa: string
  usuarios: string[]
  usuariosTotal: number
  usuariosFaltantes: number
}

export interface SucursalCreateRequest {
  nombre: string
  descripcion: string
  direccion: string
  telefono: string
  correo: string
  idEmpresa: number
}

export interface SucursalUpdateRequest {
  nombre: string
  descripcion: string
  direccion: string
  telefono: string
  correo: string
  estado: "ACTIVO" | "INACTIVO" | string
  idEmpresa: number
}

export const emptyCreate: SucursalCreateRequest = {
  nombre: "",
  descripcion: "",
  direccion: "",
  telefono: "",
  correo: "",
  idEmpresa: 1,
}

export const emptyUpdate: SucursalUpdateRequest = {
  nombre: "",
  descripcion: "",
  direccion: "",
  telefono: "",
  correo: "",
  estado: "ACTIVO",
  idEmpresa: 1,
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
