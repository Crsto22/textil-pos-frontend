export interface CatalogPageResponse<T> {
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

export interface CatalogoConductor {
  idCatalogoConductor: number
  tipoDocumento: string
  nroDocumento: string
  nombres: string
  apellidos: string
  licencia: string
  esPrincipal: boolean | null
  estado: string | null
}

export interface CatalogoConductorPayload {
  tipoDocumento: string
  nroDocumento: string
  nombres: string
  apellidos: string
  licencia: string
}

export interface CatalogoTransportista {
  idCatalogoTransportista: number
  transportistaTipoDoc: string
  transportistaNroDoc: string
  transportistaRazonSocial: string
  transportistaRegistroMtc: string | null
  estado: string | null
}

export interface CatalogoTransportistaPayload {
  transportistaTipoDoc: string
  transportistaNroDoc: string
  transportistaRazonSocial: string
  transportistaRegistroMtc: string | null
}

export interface CatalogoVehiculo {
  idCatalogoVehiculo: number
  placa: string
  esPrincipal: boolean | null
  estado: string | null
}

export interface CatalogoVehiculoPayload {
  placa: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function normalizePositiveId(value: unknown): number | null {
  const id = Number(value)
  if (!Number.isFinite(id) || id <= 0) return null
  return id
}

export function normalizeCatalogPageResponse<T>(
  value: unknown,
  normalizeItem: (item: unknown) => T | null
): CatalogPageResponse<T> {
  // Handle plain array response (backend returns [...] directly)
  if (Array.isArray(value)) {
    const content = value
      .map((item) => normalizeItem(item))
      .filter((item): item is T => item !== null)
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

  const payload = asRecord(value)

  // Try to resolve the items array from common response shapes:
  //   Spring Page: { content: [...] }
  //   Simple wrap:  { data: [...] } or { items: [...] } or { lista: [...] }
  const rawContent: unknown[] = Array.isArray(payload?.content)
    ? (payload.content as unknown[])
    : Array.isArray(payload?.data)
      ? (payload.data as unknown[])
      : Array.isArray(payload?.items)
        ? (payload.items as unknown[])
        : Array.isArray(payload?.lista)
          ? (payload.lista as unknown[])
          : []

  const content = rawContent
    .map((item) => normalizeItem(item))
    .filter((item): item is T => item !== null)

  return {
    content,
    page: typeof payload?.page === "number" ? payload.page : 0,
    size: typeof payload?.size === "number" ? payload.size : content.length,
    totalPages: typeof payload?.totalPages === "number" ? payload.totalPages : content.length > 0 ? 1 : 0,
    totalElements:
      typeof payload?.totalElements === "number" ? payload.totalElements : content.length,
    numberOfElements:
      typeof payload?.numberOfElements === "number"
        ? payload.numberOfElements
        : content.length,
    first: payload?.first === true,
    last: payload?.last === true,
    empty: payload?.empty === true || content.length === 0,
  }
}

export function normalizeCatalogoConductor(value: unknown): CatalogoConductor | null {
  const item = asRecord(value)
  const idCatalogoConductor = normalizePositiveId(item?.idCatalogoConductor)
  if (!idCatalogoConductor) return null

  return {
    idCatalogoConductor,
    tipoDocumento: normalizeString(item?.tipoDocumento),
    nroDocumento: normalizeString(item?.nroDocumento),
    nombres: normalizeString(item?.nombres),
    apellidos: normalizeString(item?.apellidos),
    licencia: normalizeString(item?.licencia),
    esPrincipal: typeof item?.esPrincipal === "boolean" ? item.esPrincipal : null,
    estado: normalizeNullableString(item?.estado),
  }
}

export function normalizeCatalogoTransportista(
  value: unknown
): CatalogoTransportista | null {
  const item = asRecord(value)
  const idCatalogoTransportista = normalizePositiveId(item?.idCatalogoTransportista)
  if (!idCatalogoTransportista) return null

  return {
    idCatalogoTransportista,
    transportistaTipoDoc: normalizeString(item?.transportistaTipoDoc),
    transportistaNroDoc: normalizeString(item?.transportistaNroDoc),
    transportistaRazonSocial: normalizeString(item?.transportistaRazonSocial),
    transportistaRegistroMtc: normalizeNullableString(item?.transportistaRegistroMtc),
    estado: normalizeNullableString(item?.estado),
  }
}

export function normalizeCatalogoVehiculo(value: unknown): CatalogoVehiculo | null {
  const item = asRecord(value)
  const idCatalogoVehiculo = normalizePositiveId(item?.idCatalogoVehiculo)
  if (!idCatalogoVehiculo) return null

  return {
    idCatalogoVehiculo,
    placa: normalizeString(item?.placa),
    esPrincipal: typeof item?.esPrincipal === "boolean" ? item.esPrincipal : null,
    estado: normalizeNullableString(item?.estado),
  }
}
