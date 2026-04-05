import type {
  Empresa,
  EmpresaCreateRequest,
  EmpresaPublica,
  EmpresaUpdateRequest,
} from "@/lib/types/empresa"

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function toOptionalTrimmedString(value: unknown): string | undefined {
  const normalized = toTrimmedString(value)
  return normalized.length > 0 ? normalized : undefined
}

export function normalizeEmpresa(value: unknown): Empresa | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>
  const idEmpresa = Number(data.idEmpresa)
  const nombre = toTrimmedString(data.nombre)

  if (!Number.isFinite(idEmpresa) || idEmpresa <= 0 || !nombre) {
    return null
  }

  return {
    idEmpresa,
    nombre,
    nombreComercial: toTrimmedString(data.nombreComercial) || nombre,
    ruc: toTrimmedString(data.ruc),
    razonSocial: toTrimmedString(data.razonSocial),
    correo: toTrimmedString(data.correo),
    telefono: toTrimmedString(data.telefono),
    direccion: toTrimmedString(data.direccion),
    ubigeo: toTrimmedString(data.ubigeo),
    departamento: toTrimmedString(data.departamento),
    provincia: toTrimmedString(data.provincia),
    distrito: toTrimmedString(data.distrito),
    codigoEstablecimientoSunat: toTrimmedString(data.codigoEstablecimientoSunat),
    fechaCreacion: toTrimmedString(data.fechaCreacion),
    logoUrl: toOptionalTrimmedString(data.logoUrl),
    generaFacturacionElectronica: data.generaFacturacionElectronica === true,
  }
}

export function normalizeEmpresaList(value: unknown): Empresa[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => normalizeEmpresa(item))
    .filter((item): item is Empresa => item !== null)
}

export function normalizeEmpresaPublica(value: unknown): EmpresaPublica | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>
  const nombreComercial =
    toTrimmedString(data.nombreComercial) || toTrimmedString(data.nombre)
  if (!nombreComercial) return null

  return {
    nombreComercial,
    logoUrl: toOptionalTrimmedString(data.logoUrl),
  }
}

export function sanitizeEmpresaPayload<
  T extends EmpresaCreateRequest | EmpresaUpdateRequest,
>(payload: T): T {
  const nextPayload = {
    ...payload,
    nombre: payload.nombre.trim(),
    nombreComercial: payload.nombreComercial.trim(),
    ruc: payload.ruc.trim(),
    razonSocial: payload.razonSocial.trim(),
    correo: payload.correo.trim(),
    telefono: payload.telefono.trim(),
    direccion: payload.direccion.trim(),
    ubigeo: payload.ubigeo.trim(),
    departamento: payload.departamento.trim(),
    provincia: payload.provincia.trim(),
    distrito: payload.distrito.trim(),
    codigoEstablecimientoSunat: payload.codigoEstablecimientoSunat.trim(),
  } as T

  if (!("logoUrl" in payload)) {
    return nextPayload
  }

  return {
    ...nextPayload,
    logoUrl: toOptionalTrimmedString(payload.logoUrl) ?? null,
  }
}

export function getEmpresaDisplayName(
  empresa:
    | Pick<Empresa, "nombre" | "nombreComercial">
    | EmpresaPublica
    | null
    | undefined
): string {
  if (!empresa) return "POS Textil"

  const nombreComercial = toTrimmedString(empresa.nombreComercial)
  if (nombreComercial) return nombreComercial

  const nombre = "nombre" in empresa ? toTrimmedString(empresa.nombre) : ""
  return nombre || "POS Textil"
}
