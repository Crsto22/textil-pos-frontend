// Tipos para el modulo de Sucursales

export interface SucursalBase {
  nombre: string
  descripcion: string
  direccion: string
  telefono: string
  correo: string
  ubigeo: string
  departamento: string
  provincia: string
  distrito: string
  codigoEstablecimientoSunat: string
  idEmpresa: number
}

export interface SucursalUsuarioDetalle {
  idUsuario: number
  nombreCompleto: string
  fotoPerfilUrl: string | null
}

export interface Sucursal extends SucursalBase {
  idSucursal: number
  estado: "ACTIVO" | "INACTIVO" | string
  fechaCreacion: string
  nombreEmpresa: string
  usuarios: string[]
  usuariosDetalle: SucursalUsuarioDetalle[]
  usuariosTotal: number
  usuariosFaltantes: number
}

export type SucursalCreateRequest = SucursalBase

export interface SucursalUpdateRequest extends SucursalBase {
  estado: "ACTIVO" | "INACTIVO" | string
}

export const emptyCreate: SucursalCreateRequest = {
  nombre: "",
  descripcion: "",
  direccion: "",
  telefono: "",
  correo: "",
  ubigeo: "",
  departamento: "",
  provincia: "",
  distrito: "",
  codigoEstablecimientoSunat: "",
  idEmpresa: 1,
}

export const emptyUpdate: SucursalUpdateRequest = {
  nombre: "",
  descripcion: "",
  direccion: "",
  telefono: "",
  correo: "",
  ubigeo: "",
  departamento: "",
  provincia: "",
  distrito: "",
  codigoEstablecimientoSunat: "",
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
