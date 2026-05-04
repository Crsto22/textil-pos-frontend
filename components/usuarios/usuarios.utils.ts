import { getRoleLabel } from "@/lib/auth/roles"
import type { SucursalPermitida } from "@/lib/types/usuario"

const avatarColors = [
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-cyan-500", text: "text-white" },
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
  { bg: "bg-pink-500", text: "text-white" },
]

export function getAvatarColor(id: number) {
  return avatarColors[id % avatarColors.length]
}

export function getInitials(nombre: string, apellido: string) {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

export function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export const rolBadge: Record<string, { label: string; cls: string }> = {
  ADMINISTRADOR: {
    label: getRoleLabel("ADMINISTRADOR"),
    cls: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  },
  VENTAS: {
    label: getRoleLabel("VENTAS"),
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  ALMACEN: {
    label: getRoleLabel("ALMACEN"),
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  VENTAS_ALMACEN: {
    label: getRoleLabel("VENTAS_ALMACEN"),
    cls: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
  },
}

export const estadoBadge: Record<string, { label: string; dot: string; cls: string }> = {
  ACTIVO: {
    label: "Activo",
    dot: "bg-emerald-500",
    cls: "text-emerald-700 dark:text-emerald-400",
  },
  INACTIVO: {
    label: "Inactivo",
    dot: "bg-red-500",
    cls: "text-red-700 dark:text-red-400",
  },
}

export function getSucursalDisplay(rol: string, nombreSucursal?: string | null) {
  const nombreNormalizado = nombreSucursal?.trim()
  if (nombreNormalizado) return nombreNormalizado
  if (rol === "ADMINISTRADOR") return "GLOBAL"
  return "Sin sucursal asignada"
}

export function getSucursalesAdicionalesDisplay(
  sucursalesPermitidas?: SucursalPermitida[] | null,
  idSucursalPrincipal?: number | null
): string[] {
  if (!Array.isArray(sucursalesPermitidas) || sucursalesPermitidas.length === 0) {
    return []
  }

  return sucursalesPermitidas
    .filter((s) => s.idSucursal !== idSucursalPrincipal)
    .map((s) => s.nombreSucursal)
}

const DIA_LABEL_SHORT: Record<string, string> = {
  LUNES: "Lun",
  MARTES: "Mar",
  MIERCOLES: "Mié",
  JUEVES: "Jue",
  VIERNES: "Vie",
  SABADO: "Sáb",
  DOMINGO: "Dom",
}

export function getTurnoDisplay(
  nombreTurno?: string | null,
  horaInicioTurno?: string | null,
  horaFinTurno?: string | null,
  diasTurno?: string[] | null
) {
  const nombre = nombreTurno?.trim()
  const horario = [horaInicioTurno?.trim(), horaFinTurno?.trim()].filter(Boolean).join(" – ")
  const diasLabel =
    Array.isArray(diasTurno) && diasTurno.length > 0
      ? diasTurno.map((d) => DIA_LABEL_SHORT[d] ?? d.slice(0, 3)).join(", ")
      : null

  if (nombre && horario && diasLabel) return `${nombre} (${horario}) · ${diasLabel}`
  if (nombre && horario) return `${nombre} (${horario})`
  if (nombre) return nombre
  return "Sin turno asignado"
}
