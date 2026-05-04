import type {
  ComprobanteConfig,
  EstadoComprobante,
  PageResponse,
} from "@/lib/types/comprobante"

export interface ComprobanteTipoOption {
  value: string
  label: string
}

export const COMPROBANTE_TIPO_OPTIONS: ComprobanteTipoOption[] = [
  { value: "NOTA DE VENTA", label: "NOTA DE VENTA" },
  { value: "FACTURA", label: "FACTURA" },
  { value: "BOLETA", label: "BOLETA" },
  { value: "NOTA_CREDITO_BOLETA", label: "NOTA DE CREDITO BOLETA" },
  { value: "NOTA_CREDITO_FACTURA", label: "NOTA DE CREDITO FACTURA" },
  { value: "COTIZACION", label: "COTIZACIÓN" },
]

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function toNullableString(value: unknown): string | null {
  const normalized = toTrimmedString(value)
  return normalized.length > 0 ? normalized : null
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }
  return fallback
}

export function normalizeComprobanteActivo(value: unknown): EstadoComprobante {
  if (value === true) return "ACTIVO"
  if (value === false) return "INACTIVO"

  const normalized = toTrimmedString(value).toUpperCase()
  if (normalized === "ACTIVO" || normalized === "INACTIVO") {
    return normalized
  }

  return normalized || "ACTIVO"
}

export function normalizeComprobante(value: unknown): ComprobanteConfig | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>
  const idComprobante = toNumber(
    data.idComprobante ?? data.id_comprobante ?? data.id
  )

  if (idComprobante <= 0) return null

  const ultimoCorrelativo = toNumber(data.ultimoCorrelativo)
  const siguienteCorrelativo = toNumber(
    data.siguienteCorrelativo,
    Math.max(0, ultimoCorrelativo + 1)
  )

  return {
    idComprobante,
    tipoComprobante: toTrimmedString(
      data.tipoComprobante ?? data.tipo_comprobante
    ),
    serie: toTrimmedString(data.serie),
    ultimoCorrelativo,
    siguienteCorrelativo,
    activo: normalizeComprobanteActivo(data.activo ?? data.estado),
    habilitadoVenta: toBoolean(data.habilitadoVenta, true),
    createdAt: toNullableString(data.createdAt ?? data.fechaRegistro),
    updatedAt: toNullableString(data.updatedAt ?? data.fechaActualizacion),
    deletedAt: toNullableString(data.deletedAt),
  }
}

export function normalizeComprobantePageResponse(
  value: unknown
): PageResponse<ComprobanteConfig> {
  if (Array.isArray(value)) {
    const content = value
      .map((item) => normalizeComprobante(item))
      .filter((item): item is ComprobanteConfig => item !== null)

    return {
      content,
      page: 0,
      size: content.length,
      totalPages: content.length > 0 ? 1 : 0,
      totalElements: content.length,
      numberOfElements: content.length,
      first: true,
      last: true,
      empty: content.length === 0,
    }
  }

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
        .map((item) => normalizeComprobante(item))
        .filter((item): item is ComprobanteConfig => item !== null)
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

export function formatComprobanteTipoLabel(value: string) {
  const normalized = value.trim()
  if (!normalized) return "Sin tipo"

  const option = COMPROBANTE_TIPO_OPTIONS.find(
    (item) => item.value === normalized
  )
  if (option) {
    return option.label
  }

  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function getComprobanteTipoOptions(
  selectedValue?: string | null
): ComprobanteTipoOption[] {
  const normalizedValue =
    typeof selectedValue === "string" ? selectedValue.trim() : ""

  if (!normalizedValue) {
    return COMPROBANTE_TIPO_OPTIONS
  }

  const exists = COMPROBANTE_TIPO_OPTIONS.some(
    (option) => option.value === normalizedValue
  )

  if (exists) {
    return COMPROBANTE_TIPO_OPTIONS
  }

  return [
    ...COMPROBANTE_TIPO_OPTIONS,
    {
      value: normalizedValue,
      label: formatComprobanteTipoLabel(normalizedValue),
    },
  ]
}

export function buildComprobanteLabel(comprobante: ComprobanteConfig): string {
  const tipo = formatComprobanteTipoLabel(comprobante.tipoComprobante)
  if (comprobante.serie) {
    return `${tipo} (${comprobante.serie})`
  }

  return tipo
}

export function buildComprobanteDescription(comprobante: ComprobanteConfig): string {
  if (comprobante.serie) {
    return `Correlativo actual ${comprobante.ultimoCorrelativo}`
  }

  return `Siguiente ${comprobante.siguienteCorrelativo}`
}
