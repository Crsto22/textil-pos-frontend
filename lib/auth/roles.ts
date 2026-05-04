import type { TipoSucursal } from "@/lib/types/sucursal"

export const AUTH_ROLES = [
  "ADMINISTRADOR",
  "VENTAS",
  "ALMACEN",
  "VENTAS_ALMACEN",
  "SISTEMA",
] as const

export const LEGACY_AUTH_ROLES = ["VENDEDOR"] as const

export type AuthRole = (typeof AUTH_ROLES)[number]
export type LegacyAuthRole = (typeof LEGACY_AUTH_ROLES)[number]
export type SupportedAuthRole = AuthRole | LegacyAuthRole

const SUPPORTED_ROLE_SET = new Set<string>([
  ...AUTH_ROLES,
  ...LEGACY_AUTH_ROLES,
])

export const ROLE_LABELS: Record<SupportedAuthRole, string> = {
  ADMINISTRADOR: "Administrador",
  VENTAS: "Ventas",
  ALMACEN: "Almacen",
  VENTAS_ALMACEN: "Ventas y Almacen",
  VENDEDOR: "Vendedor",
  SISTEMA: "Sistema",
}

export function normalizeSupportedRole(
  role: string | null | undefined
): SupportedAuthRole | null {
  const normalizedRole = role?.trim().toUpperCase()

  if (!normalizedRole || !SUPPORTED_ROLE_SET.has(normalizedRole)) {
    return null
  }

  return normalizedRole as SupportedAuthRole
}

export function isAdministratorRole(role: string | null | undefined): boolean {
  return normalizeSupportedRole(role) === "ADMINISTRADOR"
}

export function roleHasVentasAccess(role: string | null | undefined): boolean {
  const normalizedRole = normalizeSupportedRole(role)

  return (
    normalizedRole === "ADMINISTRADOR" ||
    normalizedRole === "VENTAS" ||
    normalizedRole === "VENTAS_ALMACEN" ||
    normalizedRole === "VENDEDOR"
  )
}

export function roleCanManageStock(role: string | null | undefined): boolean {
  const normalizedRole = normalizeSupportedRole(role)
  return normalizedRole === "ADMINISTRADOR" || normalizedRole === "VENTAS_ALMACEN"
}

export function roleHasAlmacenAccess(role: string | null | undefined): boolean {
  const normalizedRole = normalizeSupportedRole(role)

  return (
    normalizedRole === "ADMINISTRADOR" ||
    normalizedRole === "ALMACEN" ||
    normalizedRole === "VENTAS_ALMACEN"
  )
}

export function getRoleLabel(role: string | null | undefined): string {
  const normalizedRole = normalizeSupportedRole(role)

  if (normalizedRole) {
    return ROLE_LABELS[normalizedRole]
  }

  const fallbackLabel = role?.trim()
  if (!fallbackLabel) return ""

  return fallbackLabel
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function roleIsRestrictedToSucursalOffer(role: string | null | undefined): boolean {
  const normalizedRole = normalizeSupportedRole(role)
  return normalizedRole === "ALMACEN" || normalizedRole === "VENTAS_ALMACEN"
}

export function normalizeUsuarioTipoSucursal(
  value: string | null | undefined
): TipoSucursal | null {
  if (value === "VENTA" || value === "ALMACEN") return value
  return null
}
