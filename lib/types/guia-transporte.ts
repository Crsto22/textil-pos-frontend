function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function normalizePositiveId(value: unknown): number | null {
  const id = Number(value)
  if (!Number.isFinite(id) || id <= 0) return null
  return id
}

function normalizeNullableBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value
  return null
}

// ─── Conductor (per-guia) ────────────────────────────────────────────────────

export interface GuiaConductor {
  idGuiaConductor: number
  idGuiaRemision: number
  tipoDocumento: string
  nroDocumento: string
  nombres: string
  apellidos: string
  licencia: string
  esPrincipal: boolean | null
}

export interface GuiaConductorPayload {
  tipoDocumento: string
  nroDocumento: string
  nombres: string
  apellidos: string
  licencia: string
  esPrincipal?: boolean
}

export function normalizeGuiaConductor(value: unknown): GuiaConductor | null {
  const item = asRecord(value)
  const idGuiaConductor = normalizePositiveId(item?.idGuiaConductor)
  const idGuiaRemision = normalizePositiveId(item?.idGuiaRemision)
  if (!idGuiaConductor || !idGuiaRemision) return null

  return {
    idGuiaConductor,
    idGuiaRemision,
    tipoDocumento: normalizeString(item?.tipoDocumento, "1"),
    nroDocumento: normalizeString(item?.nroDocumento),
    nombres: normalizeString(item?.nombres),
    apellidos: normalizeString(item?.apellidos),
    licencia: normalizeString(item?.licencia),
    esPrincipal: normalizeNullableBoolean(item?.esPrincipal),
  }
}

// ─── Vehiculo / Placa (per-guia) ─────────────────────────────────────────────

export interface GuiaVehiculo {
  idGuiaVehiculo: number
  idGuiaRemision: number
  placa: string
  esPrincipal: boolean | null
}

export interface GuiaVehiculoPayload {
  placa: string
  esPrincipal?: boolean
}

export function normalizeGuiaVehiculo(value: unknown): GuiaVehiculo | null {
  const item = asRecord(value)
  const idGuiaVehiculo = normalizePositiveId(item?.idGuiaVehiculo)
  const idGuiaRemision = normalizePositiveId(item?.idGuiaRemision)
  if (!idGuiaVehiculo || !idGuiaRemision) return null

  return {
    idGuiaVehiculo,
    idGuiaRemision,
    placa: normalizeString(item?.placa),
    esPrincipal: normalizeNullableBoolean(item?.esPrincipal),
  }
}

// ─── Shared page response ─────────────────────────────────────────────────────

export interface GuiaTransportePageResponse<T> {
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

export function normalizeGuiaTransportePageResponse<T>(
  value: unknown,
  normalizeItem: (item: unknown) => T | null
): GuiaTransportePageResponse<T> {
  const payload = asRecord(value)

  // Backend may return a paginated object or a plain array
  const rawContent = Array.isArray(payload?.content)
    ? payload.content
    : Array.isArray(value)
      ? (value as unknown[])
      : []

  const content = rawContent
    .map((item) => normalizeItem(item))
    .filter((item): item is T => item !== null)

  return {
    content,
    page: typeof payload?.page === "number" ? payload.page : 0,
    size: typeof payload?.size === "number" ? payload.size : content.length,
    totalPages: typeof payload?.totalPages === "number" ? payload.totalPages : (content.length > 0 ? 1 : 0),
    totalElements:
      typeof payload?.totalElements === "number" ? payload.totalElements : content.length,
    numberOfElements:
      typeof payload?.numberOfElements === "number" ? payload.numberOfElements : content.length,
    first: payload?.first !== false,
    last: payload?.last !== false,
    empty: content.length === 0,
  }
}
