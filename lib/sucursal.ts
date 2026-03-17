import type {
  PageResponse,
  Sucursal,
  SucursalCreateRequest,
  SucursalUpdateRequest,
} from "@/lib/types/sucursal"

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeUsuarios(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => toTrimmedString(item))
    .filter((item) => item.length > 0)
}

const sucursalAvatarColors = [
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-indigo-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-500 text-white",
  "bg-violet-500 text-white",
  "bg-orange-500 text-white",
]

export function normalizeSucursal(value: unknown): Sucursal | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>
  const idSucursal = toNumber(data.idSucursal)
  if (idSucursal <= 0) return null

  const usuarios = normalizeUsuarios(data.usuarios)

  return {
    idSucursal,
    nombre: toTrimmedString(data.nombre),
    descripcion: toTrimmedString(data.descripcion),
    direccion: toTrimmedString(data.direccion),
    telefono: toTrimmedString(data.telefono),
    correo: toTrimmedString(data.correo),
    ubigeo: toTrimmedString(data.ubigeo),
    departamento: toTrimmedString(data.departamento),
    provincia: toTrimmedString(data.provincia),
    distrito: toTrimmedString(data.distrito),
    codigoEstablecimientoSunat: toTrimmedString(data.codigoEstablecimientoSunat),
    estado: toTrimmedString(data.estado) || "ACTIVO",
    fechaCreacion: toTrimmedString(data.fechaCreacion),
    idEmpresa: toNumber(data.idEmpresa),
    nombreEmpresa: toTrimmedString(data.nombreEmpresa),
    usuarios,
    usuariosTotal: toNumber(data.usuariosTotal, usuarios.length),
    usuariosFaltantes: toNumber(data.usuariosFaltantes),
  }
}

export function normalizeSucursalPageResponse(
  value: unknown
): PageResponse<Sucursal> {
  if (!value || typeof value !== "object") {
    return {
      content: [],
      page: 0,
      size: 0,
      totalPages: 0,
      totalElements: 0,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    }
  }

  const data = value as Record<string, unknown>
  const content = Array.isArray(data.content)
    ? data.content
        .map((item) => normalizeSucursal(item))
        .filter((item): item is Sucursal => item !== null)
    : []

  return {
    content,
    page: toNumber(data.page),
    size: toNumber(data.size),
    totalPages: toNumber(data.totalPages),
    totalElements: toNumber(data.totalElements),
    numberOfElements: toNumber(data.numberOfElements, content.length),
    first: data.first === true,
    last: data.last === true,
    empty: data.empty === true || content.length === 0,
  }
}

export function sanitizeSucursalPayload<T extends SucursalCreateRequest | SucursalUpdateRequest>(
  payload: T
): T {
  return {
    ...payload,
    nombre: payload.nombre.trim(),
    descripcion: payload.descripcion.trim(),
    direccion: payload.direccion.trim(),
    telefono: payload.telefono.trim(),
    correo: payload.correo.trim(),
    ubigeo: payload.ubigeo.trim(),
    departamento: payload.departamento.trim(),
    provincia: payload.provincia.trim(),
    distrito: payload.distrito.trim(),
    codigoEstablecimientoSunat: payload.codigoEstablecimientoSunat.trim(),
  }
}

export function getSucursalLocationLabel(
  sucursal: Pick<Sucursal, "distrito" | "provincia" | "departamento">
): string {
  return [sucursal.distrito, sucursal.provincia, sucursal.departamento]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(", ")
}

export function getSucursalAvatarColor(idSucursal: number): string {
  return sucursalAvatarColors[idSucursal % sucursalAvatarColors.length]
}

export function getSucursalInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "S"

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}
