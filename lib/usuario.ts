import { resolveBackendUrl } from "@/lib/resolve-backend-url"
import type { PageResponse, SucursalPermitida, Usuario } from "@/lib/types/usuario"

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function toNullableTrimmedString(value: unknown): string | null {
  const trimmed = toTrimmedString(value)
  return trimmed.length > 0 ? trimmed : null
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeSucursalesPermitidas(value: unknown): SucursalPermitida[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!isRecord(item)) return null

      const idSucursal = toNumber(item.idSucursal)
      if (idSucursal <= 0) return null

      return {
        idSucursal,
        nombreSucursal: toTrimmedString(item.nombreSucursal),
        tipoSucursal: toNullableTrimmedString(item.tipoSucursal),
      }
    })
    .filter((item): item is SucursalPermitida => item !== null)
}

export function normalizeUsuario(value: unknown): Usuario | null {
  if (!isRecord(value)) return null

  const idUsuario = toNumber(value.idUsuario)
  if (idUsuario <= 0) return null

  const rawFotoPerfilUrl = toNullableTrimmedString(value.fotoPerfilUrl)

  return {
    idUsuario,
    nombre: toTrimmedString(value.nombre),
    apellido: toTrimmedString(value.apellido),
    dni: toTrimmedString(value.dni),
    telefono: toTrimmedString(value.telefono),
    correo: toTrimmedString(value.correo),
    fotoPerfilUrl: resolveBackendUrl(rawFotoPerfilUrl) ?? rawFotoPerfilUrl,
    rol: toTrimmedString(value.rol) as Usuario["rol"],
    estado: toTrimmedString(value.estado) || "ACTIVO",
    fechaCreacion: toTrimmedString(value.fechaCreacion),
    idSucursal:
      value.idSucursal === null || value.idSucursal === undefined
        ? null
        : toNumber(value.idSucursal, 0) || null,
    nombreSucursal: toNullableTrimmedString(value.nombreSucursal),
    tipoSucursal:
      toNullableTrimmedString(value.tipoSucursal) as Usuario["tipoSucursal"],
    sucursalesPermitidas: normalizeSucursalesPermitidas(value.sucursalesPermitidas),
    idTurno:
      value.idTurno === null || value.idTurno === undefined
        ? null
        : toNumber(value.idTurno, 0) || null,
    nombreTurno: toNullableTrimmedString(value.nombreTurno),
    horaInicioTurno: toNullableTrimmedString(value.horaInicioTurno),
    horaFinTurno: toNullableTrimmedString(value.horaFinTurno),
    diasTurno: Array.isArray(value.diasTurno)
      ? value.diasTurno
          .map((item) => toTrimmedString(item))
          .filter((item) => item.length > 0)
      : null,
  }
}

export function normalizeUsuarioPageResponse(
  value: unknown
): PageResponse<Usuario> {
  if (!isRecord(value)) {
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

  const content = Array.isArray(value.content)
    ? value.content
        .map((item) => normalizeUsuario(item))
        .filter((item): item is Usuario => item !== null)
    : []

  return {
    content,
    page: toNumber(value.page),
    size: toNumber(value.size),
    totalPages: toNumber(value.totalPages),
    totalElements: toNumber(value.totalElements),
    numberOfElements: toNumber(value.numberOfElements, content.length),
    first: value.first === true,
    last: value.last === true,
    empty: value.empty === true || content.length === 0,
  }
}
