import {
  AUTH_ROLES,
  ROLE_LABELS,
  normalizeUsuarioTipoSucursal,
  type AuthRole,
} from "@/lib/auth/roles"
import type { TipoSucursal } from "@/lib/types/sucursal"

// Tipos para el modulo de Usuarios

export const USUARIO_ROLES = AUTH_ROLES

export type UsuarioRol = AuthRole
export type UsuarioFormRol = UsuarioRol | ""
export const ALL_USUARIO_ROLE_FILTER = "ALL" as const
export const ALL_USUARIO_BRANCH_FILTER = "ALL" as const
export type UsuarioRoleFilter = UsuarioRol | typeof ALL_USUARIO_ROLE_FILTER

export interface UsuarioRoleOption {
  value: UsuarioRol
  label: string
}

export const USUARIO_ROLE_OPTIONS: UsuarioRoleOption[] = [
  { value: "ADMINISTRADOR", label: ROLE_LABELS.ADMINISTRADOR },
  { value: "VENTAS", label: ROLE_LABELS.VENTAS },
  { value: "ALMACEN", label: ROLE_LABELS.ALMACEN },
  { value: "VENTAS_ALMACEN", label: ROLE_LABELS.VENTAS_ALMACEN },
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

export function usuarioRolRequiresSucursal(
  rol: UsuarioRol | null | undefined
): boolean {
  return Boolean(rol) && rol !== "ADMINISTRADOR"
}

export function getSucursalTipoFilterByRol(
  rol: UsuarioRol | null | undefined
): "VENTA" | undefined {
  if (!rol || rol === "ADMINISTRADOR") return undefined
  if (rol === "VENTAS") return "VENTA"
  return undefined
}

export function isUsuarioRolAllowedForSucursalType(
  rol: UsuarioRol,
  tipoSucursal: TipoSucursal | null | undefined
): boolean {
  const normalizedTipoSucursal = normalizeUsuarioTipoSucursal(tipoSucursal)
  if (!normalizedTipoSucursal) return true

  if (rol === "ADMINISTRADOR") return false

  if (normalizedTipoSucursal === "ALMACEN") {
    return rol === "ALMACEN"
  }

  return (
    rol === "VENTAS" ||
    rol === "ALMACEN" ||
    rol === "VENTAS_ALMACEN"
  )
}

export function getAllowedUsuarioRolesBySucursalType(
  tipoSucursal: TipoSucursal | null | undefined
): UsuarioRol[] {
  const normalizedTipoSucursal = normalizeUsuarioTipoSucursal(tipoSucursal)

  if (!normalizedTipoSucursal) {
    return [...USUARIO_ROLES]
  }

  if (normalizedTipoSucursal === "ALMACEN") {
    return ["ADMINISTRADOR", "ALMACEN"]
  }

  return ["ADMINISTRADOR", "VENTAS", "ALMACEN", "VENTAS_ALMACEN"]
}

export function getUsuarioRoleOptionsBySucursalType(
  tipoSucursal: TipoSucursal | null | undefined
): UsuarioRoleOption[] {
  const allowedRoles = new Set(
    getAllowedUsuarioRolesBySucursalType(tipoSucursal)
  )

  return USUARIO_ROLE_OPTIONS.filter((option) => allowedRoles.has(option.value))
}

export function getUsuarioRolSucursalConstraintMessage(
  tipoSucursal: TipoSucursal | null | undefined
): string | null {
  const normalizedTipoSucursal = normalizeUsuarioTipoSucursal(tipoSucursal)

  if (normalizedTipoSucursal === "ALMACEN") {
    return "Las sucursales de tipo Almacen solo permiten el rol Almacen."
  }

  if (normalizedTipoSucursal === "VENTA") {
    return "Las sucursales de tipo Venta permiten los roles Ventas, Almacen y Ventas y Almacen."
  }

  return null
}

function hasValidSucursalId(
  idSucursal: number | null | undefined
): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

export interface UsuarioRoleAssignmentValidation {
  isValid: boolean
  rolError: string | null
  sucursalError: string | null
}

export function validateUsuarioRoleAssignment(
  rol: UsuarioFormRol | null | undefined,
  idSucursal: number | null | undefined,
  tipoSucursal: TipoSucursal | null | undefined
): UsuarioRoleAssignmentValidation {
  if (!rol || !isUsuarioRol(rol)) {
    return {
      isValid: false,
      rolError: "Selecciona un rol para continuar.",
      sucursalError: null,
    }
  }

  if (rol === "ADMINISTRADOR") {
    return {
      isValid: true,
      rolError: null,
      sucursalError: null,
    }
  }

  if (!hasValidSucursalId(idSucursal)) {
    return {
      isValid: false,
      rolError: null,
      sucursalError: "La sucursal es obligatoria para el rol seleccionado.",
    }
  }

  if (!isUsuarioRolAllowedForSucursalType(rol, tipoSucursal)) {
    return {
      isValid: false,
      rolError:
        getUsuarioRolSucursalConstraintMessage(tipoSucursal) ??
        "El rol seleccionado no es valido para la sucursal elegida.",
      sucursalError: null,
    }
  }

  return {
    isValid: true,
    rolError: null,
    sucursalError: null,
  }
}

export interface SucursalPermitida {
  idSucursal: number
  nombreSucursal: string
  tipoSucursal: string | null
}

interface UsuarioBaseResponse {
  idUsuario: number
  nombre: string
  apellido: string
  dni: string
  telefono: string
  correo: string
  fotoPerfilUrl: string | null
  rol: UsuarioRol
  estado?: "ACTIVO" | "INACTIVO" | string
  fechaCreacion: string
  idSucursal: number | null
  nombreSucursal: string | null
  tipoSucursal: TipoSucursal | null
  sucursalesPermitidas?: SucursalPermitida[]
  idTurno: number | null
  nombreTurno: string | null
  horaInicioTurno: string | null
  horaFinTurno: string | null
  diasTurno: string[] | null
}

export interface UsuarioSesionResponse extends UsuarioBaseResponse {
  access_token: string
}

export interface UsuarioItemResponse extends UsuarioBaseResponse {
  estado: "ACTIVO" | "INACTIVO" | string
}

export type Usuario = UsuarioItemResponse

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
  idsSucursales?: number[] | null
  idTurno?: number | null
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
  idsSucursales?: number[] | null
  idTurno?: number | null
}

export interface UsuarioCreateFormState
  extends Omit<UsuarioCreateRequest, "rol"> {
  rol: UsuarioFormRol
}

export interface UsuarioUpdateFormState
  extends Omit<UsuarioUpdateRequest, "rol"> {
  rol: UsuarioFormRol
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
  idsSucursales: [],
  idTurno: null,
}

export const emptyCreateForm: UsuarioCreateFormState = {
  ...emptyCreate,
  rol: "",
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
  idsSucursales: [],
  idTurno: null,
}

export const emptyUpdateForm: UsuarioUpdateFormState = {
  ...emptyUpdate,
  rol: "",
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
