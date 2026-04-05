// Tipos para el modulo de Sucursales

export type TipoSucursal = "VENTA" | "ALMACEN"

export interface SucursalBase {
  nombre: string
  ciudad: string
  direccion: string
  telefono: string
  correo: string
  tipo: TipoSucursal
  idEmpresa: number
}

export interface SucursalRequestBase
  extends Omit<SucursalBase, "telefono" | "correo"> {
  telefono?: string
  correo?: string
}

export interface SucursalUsuarioDetalle {
  idUsuario: number
  nombreCompleto: string
  rol: string
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

export type SucursalCreateRequest = SucursalRequestBase

export interface SucursalUpdateRequest extends SucursalRequestBase {
  estado: "ACTIVO" | "INACTIVO" | string
}

export const emptyCreate: SucursalCreateRequest = {
  nombre: "",
  ciudad: "",
  direccion: "",
  telefono: "",
  correo: "",
  tipo: "VENTA",
  idEmpresa: 1,
}

export const emptyUpdate: SucursalUpdateRequest = {
  nombre: "",
  ciudad: "",
  direccion: "",
  telefono: "",
  correo: "",
  tipo: "VENTA",
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
