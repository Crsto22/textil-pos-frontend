// Tipos para el modulo de Usuarios

export const USUARIO_ROLES = ["ADMINISTRADOR", "VENTAS", "ALMACEN"] as const

export type UsuarioRol = (typeof USUARIO_ROLES)[number]
export const ALL_USUARIO_ROLE_FILTER = "ALL" as const
export const ALL_USUARIO_BRANCH_FILTER = "ALL" as const
export type UsuarioRoleFilter = UsuarioRol | typeof ALL_USUARIO_ROLE_FILTER

export interface UsuarioRoleOption {
  value: UsuarioRol
  label: string
}

export const USUARIO_ROLE_OPTIONS: UsuarioRoleOption[] = [
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "VENTAS", label: "Ventas" },
  { value: "ALMACEN", label: "Almacen" },
]

export function isUsuarioRol(value: string): value is UsuarioRol {
  return (USUARIO_ROLES as readonly string[]).includes(value)
}

export function normalizeUsuarioRol(
  value: string | null | undefined,
  fallback: UsuarioRol = "VENTAS"
): UsuarioRol {
  if (!value) return fallback
  return isUsuarioRol(value) ? value : fallback
}

export function usuarioRolRequiresSucursal(rol: UsuarioRol): boolean {
  return rol === "VENTAS" || rol === "ALMACEN"
}

export interface Usuario {
  idUsuario: number
  nombre: string
  apellido: string
  dni: string
  telefono: string
  correo: string
  rol: UsuarioRol
  estado: "ACTIVO" | "INACTIVO" | string
  fechaCreacion: string
  idSucursal: number | null
  nombreSucursal: string
}

export interface UsuarioCreateRequest {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  password: string
  rol: UsuarioRol
  estado?: "ACTIVO" | "INACTIVO" | string
  idSucursal: number | null
}

export interface UsuarioUpdateRequest {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  correo: string
  rol: UsuarioRol
  estado: string
  idSucursal: number | null
}

export interface UsuarioResetPasswordRequest {
  passwordNueva: string
  confirmarPassword: string
}

export const emptyCreate: UsuarioCreateRequest = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  email: "",
  password: "",
  rol: "VENTAS",
  estado: "ACTIVO",
  idSucursal: null,
}

export const emptyUpdate: UsuarioUpdateRequest = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  correo: "",
  rol: "VENTAS",
  estado: "ACTIVO",
  idSucursal: null,
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
