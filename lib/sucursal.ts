import type {
  ComboboxOption,
  ComboboxOptionAvatarIcon,
} from "@/components/ui/combobox"
import type {
  PageResponse,
  Sucursal,
  SucursalCreateRequest,
  SucursalUsuarioDetalle,
  SucursalUpdateRequest,
} from "@/lib/types/sucursal"

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toOptionalTrimmedString(value: unknown): string | undefined {
  const trimmed = toTrimmedString(value)
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeUsuarios(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => toTrimmedString(item))
    .filter((item) => item.length > 0)
}

function normalizeUsuariosDetalle(value: unknown): SucursalUsuarioDetalle[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null

      const data = item as Record<string, unknown>
      const idUsuario = toNumber(data.idUsuario)
      const nombreCompleto = toTrimmedString(data.nombreCompleto)
      if (idUsuario <= 0 || nombreCompleto.length === 0) return null

      const fotoPerfilUrl = toTrimmedString(data.fotoPerfilUrl)

      return {
        idUsuario,
        nombreCompleto,
        rol: toTrimmedString(data.rol),
        fotoPerfilUrl: fotoPerfilUrl.length > 0 ? fotoPerfilUrl : null,
      }
    })
    .filter((item): item is SucursalUsuarioDetalle => item !== null)
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

export function getSucursalTypeLabel(tipo: string | null | undefined): string {
  const normalizedTipo = toTrimmedString(tipo).toUpperCase()

  if (normalizedTipo === "VENTA") return "Venta"
  if (normalizedTipo === "ALMACEN") return "Almacen"
  if (!normalizedTipo) return ""

  return normalizedTipo.charAt(0) + normalizedTipo.slice(1).toLowerCase()
}

export function getSucursalAvatarIcon(
  tipo: string | null | undefined
): ComboboxOptionAvatarIcon {
  return toTrimmedString(tipo).toUpperCase() === "ALMACEN"
    ? "warehouse"
    : "storefront"
}

export function buildSucursalComboboxOption(input: {
  idSucursal: number
  nombre: string
  tipo?: string | null
}): ComboboxOption {
  const label = toTrimmedString(input.nombre) || `Sucursal #${input.idSucursal}`
  const typeLabel = getSucursalTypeLabel(input.tipo)
  const description = typeLabel ? `Tipo: ${typeLabel}` : undefined

  return {
    value: String(input.idSucursal),
    label,
    description,
    triggerDescription: description,
    avatarIcon: getSucursalAvatarIcon(input.tipo),
    avatarClassName:
      "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  }
}

export function normalizeSucursal(value: unknown): Sucursal | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>
  const idSucursal = toNumber(data.idSucursal)
  if (idSucursal <= 0) return null

  const usuarios = normalizeUsuarios(data.usuarios)
  const usuariosDetalle = normalizeUsuariosDetalle(data.usuariosDetalle)

  return {
    idSucursal,
    nombre: toTrimmedString(data.nombre),
    ciudad: toTrimmedString(data.ciudad),
    direccion: toTrimmedString(data.direccion),
    telefono: toTrimmedString(data.telefono),
    correo: toTrimmedString(data.correo),
    tipo: (toTrimmedString(data.tipo) || "VENTA") as "VENTA" | "ALMACEN",
    estado: toTrimmedString(data.estado) || "ACTIVO",
    fechaCreacion: toTrimmedString(data.fechaCreacion),
    idEmpresa: toNumber(data.idEmpresa),
    nombreEmpresa: toTrimmedString(data.nombreEmpresa),
    usuarios,
    usuariosDetalle,
    usuariosTotal: toNumber(
      data.usuariosTotal,
      Math.max(usuariosDetalle.length, usuarios.length)
    ),
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

export function sanitizeSucursalRequestBody(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {}

  const { telefono, correo, ...rest } = value
  const sanitizedPayload: Record<string, unknown> = {
    ...rest,
    nombre: toTrimmedString(value.nombre),
    ciudad: toTrimmedString(value.ciudad),
    direccion: toTrimmedString(value.direccion),
  }

  const sanitizedTelefono = toOptionalTrimmedString(telefono)
  const sanitizedCorreo = toOptionalTrimmedString(correo)

  if (sanitizedTelefono) {
    sanitizedPayload.telefono = sanitizedTelefono
  }

  if (sanitizedCorreo) {
    sanitizedPayload.correo = sanitizedCorreo
  }

  return sanitizedPayload
}

export function sanitizeSucursalPayload(
  payload: SucursalCreateRequest | SucursalUpdateRequest
): SucursalCreateRequest | SucursalUpdateRequest {
  return sanitizeSucursalRequestBody(payload) as unknown as
    | SucursalCreateRequest
    | SucursalUpdateRequest
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
