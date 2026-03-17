import type { Empresa } from "@/lib/types/empresa"

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

export function normalizeEmpresaPublica(value: unknown): Empresa | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>
  const nombre = toTrimmedString(data.nombre)
  if (!nombre) return null

  return {
    idEmpresa: 0,
    nombre,
    nombreComercial: toTrimmedString(data.nombreComercial) || nombre,
    ruc: "",
    razonSocial: "",
    correo: "",
    telefono: "",
    fechaCreacion: "",
    logoUrl: toOptionalTrimmedString(data.logoUrl),
    generaFacturacionElectronica: data.generaFacturacionElectronica === true,
  }
}

export function getEmpresaDisplayName(
  empresa: Pick<Empresa, "nombre" | "nombreComercial"> | null | undefined
): string {
  if (!empresa) return "POS Textil"

  const nombreComercial = toTrimmedString(empresa.nombreComercial)
  if (nombreComercial) return nombreComercial

  const nombre = toTrimmedString(empresa.nombre)
  return nombre || "POS Textil"
}
