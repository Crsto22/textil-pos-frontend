import { NextRequest, NextResponse } from "next/server"

export const BACKEND_URL = process.env.BACKEND_URL

export type RouteContext = { params: Promise<{ id: string }> }

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string }

interface GuiaRemisionDetallePayload {
  idProductoVariante: number
  cantidad: number
  descripcion?: string
  unidadMedida?: string
  codigoProducto?: string
  pesoUnitario?: number
}

interface GuiaRemisionConductorPayload {
  tipoDocumento: string
  nroDocumento: string
  nombres: string
  apellidos: string
  licencia: string
}

interface GuiaRemisionTransportistaPayload {
  transportistaTipoDoc: string
  transportistaNroDoc: string
  transportistaRazonSocial: string
  transportistaRegistroMtc?: string | null
}

interface GuiaRemisionVehiculoPayload {
  placa: string
}

interface GuiaRemisionDocumentoRelacionadoPayload {
  tipoDocumento: string
  serie: string
  numero: string
}

interface GuiaRemisionWritePayload {
  serie?: string
  motivoTraslado?: string
  descripcionMotivo?: string | null
  idSucursalPartida?: number
  idSucursalLlegada?: number
  fechaInicioTraslado?: string
  modalidadTransporte?: string
  pesoBrutoTotal?: number
  unidadPeso?: string
  numeroBultos?: number | null
  observaciones?: string | null
  documentosRelacionados?: GuiaRemisionDocumentoRelacionadoPayload[]
  ubigeoPartida?: string
  direccionPartida?: string
  ubigeoLlegada?: string
  direccionLlegada?: string
  destinatarioTipoDoc?: string
  destinatarioNroDoc?: string
  destinatarioRazonSocial?: string
  detalles?: GuiaRemisionDetallePayload[]
  conductores?: GuiaRemisionConductorPayload[]
  transportistas?: GuiaRemisionTransportistaPayload[]
  vehiculos?: GuiaRemisionVehiculoPayload[]
  emitirDirectamente?: boolean
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function getTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function getPositiveInteger(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function getNonNegativeInteger(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
}

function getPositiveNumber(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function getOptionalPositiveNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null
  return getPositiveNumber(value)
}

function getBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value
  return null
}

const MOTIVOS_TRASLADO_HABILITADOS = new Set([
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "13",
  "14",
  "17",
])

const DOCUMENTOS_RELACIONADOS_HABILITADOS = new Set(["01", "03", "04"])

function hasOwnSucursal(payload: Record<string, unknown>, key: string) {
  return payload[key] !== undefined && payload[key] !== null && payload[key] !== ""
}

function validateUbigeo(value: string | null, label: string): ValidationResult<string> {
  if (!value || !/^\d{6}$/.test(value)) {
    return { ok: false, message: `${label} invalido` }
  }
  return { ok: true, data: value }
}

function isManualConductorPayload(value: Record<string, unknown>) {
  return Boolean(
    getTrimmedString(value.tipoDocumento) ||
      getTrimmedString(value.nroDocumento) ||
      getTrimmedString(value.nombres) ||
      getTrimmedString(value.apellidos) ||
      getTrimmedString(value.licencia)
  )
}

function isManualTransportistaPayload(value: Record<string, unknown>) {
  return Boolean(
    getTrimmedString(value.transportistaTipoDoc) ||
      getTrimmedString(value.transportistaNroDoc) ||
      getTrimmedString(value.transportistaRazonSocial) ||
      getTrimmedString(value.transportistaRegistroMtc)
  )
}

function isManualVehiculoPayload(value: Record<string, unknown>) {
  return Boolean(getTrimmedString(value.placa))
}

function normalizeDetalle(
  value: unknown,
  index: number
): ValidationResult<GuiaRemisionDetallePayload> {
  const item = asRecord(value)
  if (!item) {
    return { ok: false, message: `Detalle ${index + 1} invalido` }
  }

  const idProductoVariante = getPositiveInteger(item.idProductoVariante)
  if (!idProductoVariante) {
    return { ok: false, message: `Detalle ${index + 1}: idProductoVariante invalido` }
  }

  const cantidad = getPositiveNumber(item.cantidad)
  if (!cantidad) {
    return { ok: false, message: `Detalle ${index + 1}: cantidad invalida` }
  }

  const payload: GuiaRemisionDetallePayload = {
    idProductoVariante,
    cantidad,
    unidadMedida: getTrimmedString(item.unidadMedida) ?? "NIU",
  }

  const descripcion = getTrimmedString(item.descripcion)
  if (descripcion) payload.descripcion = descripcion

  const codigoProducto = getTrimmedString(item.codigoProducto)
  if (codigoProducto) payload.codigoProducto = codigoProducto

  const pesoUnitario = getOptionalPositiveNumber(item.pesoUnitario)
  if (item.pesoUnitario !== undefined && item.pesoUnitario !== null && !pesoUnitario) {
    return { ok: false, message: `Detalle ${index + 1}: pesoUnitario invalido` }
  }
  if (pesoUnitario) payload.pesoUnitario = pesoUnitario

  return { ok: true, data: payload }
}

function normalizeDocumentoRelacionado(
  value: unknown,
  index: number
): ValidationResult<GuiaRemisionDocumentoRelacionadoPayload> {
  const item = asRecord(value)
  if (!item) {
    return { ok: false, message: `Documento relacionado ${index + 1} invalido` }
  }

  const tipoDocumento = getTrimmedString(item.tipoDocumento)
  if (!tipoDocumento || !DOCUMENTOS_RELACIONADOS_HABILITADOS.has(tipoDocumento)) {
    return {
      ok: false,
      message:
        `Documento relacionado ${index + 1}: tipoDocumento invalido. Use 01, 03 o 04`,
    }
  }

  const serie = getTrimmedString(item.serie)?.toUpperCase()
  if (!serie) {
    return { ok: false, message: `Documento relacionado ${index + 1}: serie obligatoria` }
  }

  const numero = getTrimmedString(item.numero)
  if (!numero || !/^\d{1,8}$/.test(numero)) {
    return {
      ok: false,
      message: `Documento relacionado ${index + 1}: numero invalido`,
    }
  }

  return {
    ok: true,
    data: {
      tipoDocumento,
      serie,
      numero,
    },
  }
}

export function normalizeConductor(
  value: unknown,
  index: number
): ValidationResult<GuiaRemisionConductorPayload> {
  const item = asRecord(value)
  if (!item) {
    return { ok: false, message: `Conductor ${index + 1} invalido` }
  }

  if (item.idCatalogoConductor !== undefined && !isManualConductorPayload(item)) {
    return {
      ok: false,
      message:
        "Los catalogos de conductores por ID ya no estan vigentes. Envie los datos del conductor manualmente.",
    }
  }

  const tipoDocumento = getTrimmedString(item.tipoDocumento) ?? "1"
  const nroDocumento = getTrimmedString(item.nroDocumento)
  const nombres = getTrimmedString(item.nombres)
  const apellidos = getTrimmedString(item.apellidos)
  const licencia = getTrimmedString(item.licencia)

  if (!nroDocumento || !nombres || !apellidos || !licencia) {
    return { ok: false, message: `Conductor ${index + 1}: datos incompletos` }
  }

  return {
    ok: true,
    data: {
      tipoDocumento,
      nroDocumento,
      nombres,
      apellidos,
      licencia,
    },
  }
}

export function normalizeTransportista(
  value: unknown,
  index: number
): ValidationResult<GuiaRemisionTransportistaPayload> {
  const item = asRecord(value)
  if (!item) {
    return { ok: false, message: `Transportista ${index + 1} invalido` }
  }

  if (item.idCatalogoTransportista !== undefined && !isManualTransportistaPayload(item)) {
    return {
      ok: false,
      message:
        "Los catalogos de transportistas por ID ya no estan vigentes. Envie los datos del transportista manualmente.",
    }
  }

  const transportistaTipoDoc = getTrimmedString(item.transportistaTipoDoc) ?? "6"
  const transportistaNroDoc = getTrimmedString(item.transportistaNroDoc)
  const transportistaRazonSocial = getTrimmedString(item.transportistaRazonSocial)
  const transportistaRegistroMtc = getTrimmedString(item.transportistaRegistroMtc)

  if (!transportistaNroDoc || !transportistaRazonSocial) {
    return { ok: false, message: `Transportista ${index + 1}: datos incompletos` }
  }

  return {
    ok: true,
    data: {
      transportistaTipoDoc,
      transportistaNroDoc,
      transportistaRazonSocial,
      ...(transportistaRegistroMtc ? { transportistaRegistroMtc } : {}),
    },
  }
}

export function normalizeVehiculo(
  value: unknown,
  index: number
): ValidationResult<GuiaRemisionVehiculoPayload> {
  const item = asRecord(value)
  if (!item) {
    return { ok: false, message: `Vehiculo ${index + 1} invalido` }
  }

  if (item.idCatalogoVehiculo !== undefined && !isManualVehiculoPayload(item)) {
    return {
      ok: false,
      message:
        "Los catalogos de vehiculos por ID ya no estan vigentes. Envie la placa manualmente.",
    }
  }

  const placa = getTrimmedString(item.placa)
  if (!placa) {
    return { ok: false, message: `Vehiculo ${index + 1}: placa invalida` }
  }

  return {
    ok: true,
    data: {
      placa: placa.toUpperCase(),
    },
  }
}

function normalizeArray<T>(
  raw: unknown,
  label: string,
  normalizeItem: (value: unknown, index: number) => ValidationResult<T>
): ValidationResult<T[]> {
  if (!Array.isArray(raw)) {
    return { ok: false, message: `${label} debe ser un arreglo` }
  }

  const items: T[] = []
  for (const [index, item] of raw.entries()) {
    const normalized = normalizeItem(item, index)
    if (!normalized.ok) {
      return normalized
    }
    items.push(normalized.data)
  }

  return { ok: true, data: items }
}

export function normalizeGuiaRemisionWritePayload(
  value: unknown,
  options?: { partial?: boolean }
): ValidationResult<GuiaRemisionWritePayload> {
  const partial = options?.partial === true
  const payload = asRecord(value)
  if (!payload) {
    return { ok: false, message: "Body invalido o vacio" }
  }

  const normalized: GuiaRemisionWritePayload = {}

  const serie = getTrimmedString(payload.serie)
  if (serie) {
    normalized.serie = serie
  }

  const motivoTraslado =
    getTrimmedString(payload.motivoTraslado) ?? (partial ? null : "04")
  if (motivoTraslado) {
    if (!MOTIVOS_TRASLADO_HABILITADOS.has(motivoTraslado)) {
      return { ok: false, message: "motivoTraslado invalido" }
    }
    normalized.motivoTraslado = motivoTraslado
  }

  const motivoActual = motivoTraslado ?? getTrimmedString(payload.motivoTraslado)

  if (payload.descripcionMotivo !== undefined) {
    const descripcionMotivo = getTrimmedString(payload.descripcionMotivo)
    normalized.descripcionMotivo = descripcionMotivo ?? null
  }

  if (!partial && motivoActual === "13" && !getTrimmedString(payload.descripcionMotivo)) {
    return {
      ok: false,
      message: "descripcionMotivo es obligatoria para el motivo 13",
    }
  }

  if (payload.idSucursalPartida !== undefined || (!partial && motivoActual === "04")) {
    const idSucursalPartida = getPositiveInteger(payload.idSucursalPartida)
    if (!idSucursalPartida) {
      return { ok: false, message: "idSucursalPartida invalido" }
    }
    normalized.idSucursalPartida = idSucursalPartida
  }

  if (payload.idSucursalLlegada !== undefined || (!partial && motivoActual === "04")) {
    const idSucursalLlegada = getPositiveInteger(payload.idSucursalLlegada)
    if (!idSucursalLlegada) {
      return { ok: false, message: "idSucursalLlegada invalido" }
    }
    normalized.idSucursalLlegada = idSucursalLlegada
  }

  if (payload.fechaInicioTraslado !== undefined || !partial) {
    const fechaInicioTraslado = getTrimmedString(payload.fechaInicioTraslado)
    if (!fechaInicioTraslado) {
      return { ok: false, message: "fechaInicioTraslado es obligatoria" }
    }
    normalized.fechaInicioTraslado = fechaInicioTraslado
  }

  if (payload.modalidadTransporte !== undefined || !partial) {
    const modalidadTransporte = getTrimmedString(payload.modalidadTransporte)
    if (modalidadTransporte !== "01" && modalidadTransporte !== "02") {
      return { ok: false, message: "modalidadTransporte invalida" }
    }
    normalized.modalidadTransporte = modalidadTransporte
  }

  if (payload.pesoBrutoTotal !== undefined || !partial) {
    const pesoBrutoTotal = getPositiveNumber(payload.pesoBrutoTotal)
    if (!pesoBrutoTotal) {
      return { ok: false, message: "pesoBrutoTotal invalido" }
    }
    normalized.pesoBrutoTotal = pesoBrutoTotal
  }

  if (payload.unidadPeso !== undefined || !partial) {
    const unidadPeso = getTrimmedString(payload.unidadPeso) ?? "KGM"
    normalized.unidadPeso = unidadPeso
  }

  if (payload.numeroBultos !== undefined) {
    if (payload.numeroBultos === null || payload.numeroBultos === "") {
      normalized.numeroBultos = null
    } else {
      const numeroBultos = getNonNegativeInteger(payload.numeroBultos)
      if (numeroBultos === null) {
        return { ok: false, message: "numeroBultos invalido" }
      }
      normalized.numeroBultos = numeroBultos
    }
  }

  if (payload.observaciones !== undefined) {
    normalized.observaciones = getTrimmedString(payload.observaciones) ?? null
  }

  if (payload.documentosRelacionados !== undefined) {
    const documentosRelacionados = normalizeArray(
      payload.documentosRelacionados,
      "documentosRelacionados",
      normalizeDocumentoRelacionado
    )
    if (!documentosRelacionados.ok) {
      return documentosRelacionados
    }
    normalized.documentosRelacionados = documentosRelacionados.data
  }

  if (payload.ubigeoPartida !== undefined || (!partial && !hasOwnSucursal(payload, "idSucursalPartida"))) {
    const ubigeoPartida = validateUbigeo(getTrimmedString(payload.ubigeoPartida), "ubigeoPartida")
    if (!ubigeoPartida.ok) return ubigeoPartida
    normalized.ubigeoPartida = ubigeoPartida.data
  }

  if (payload.direccionPartida !== undefined || (!partial && !hasOwnSucursal(payload, "idSucursalPartida"))) {
    const direccionPartida = getTrimmedString(payload.direccionPartida)
    if (!direccionPartida) {
      return { ok: false, message: "direccionPartida es obligatoria para direccion externa" }
    }
    normalized.direccionPartida = direccionPartida
  }

  if (payload.ubigeoLlegada !== undefined || (!partial && !hasOwnSucursal(payload, "idSucursalLlegada"))) {
    const ubigeoLlegada = validateUbigeo(getTrimmedString(payload.ubigeoLlegada), "ubigeoLlegada")
    if (!ubigeoLlegada.ok) return ubigeoLlegada
    normalized.ubigeoLlegada = ubigeoLlegada.data
  }

  if (payload.direccionLlegada !== undefined || (!partial && !hasOwnSucursal(payload, "idSucursalLlegada"))) {
    const direccionLlegada = getTrimmedString(payload.direccionLlegada)
    if (!direccionLlegada) {
      return { ok: false, message: "direccionLlegada es obligatoria para direccion externa" }
    }
    normalized.direccionLlegada = direccionLlegada
  }

  if (!partial && motivoActual === "04") {
    if (normalized.idSucursalPartida === normalized.idSucursalLlegada) {
      return { ok: false, message: "idSucursalLlegada debe ser distinta a idSucursalPartida" }
    }
  }

  if (payload.destinatarioTipoDoc !== undefined) {
    const destinatarioTipoDoc = getTrimmedString(payload.destinatarioTipoDoc)
    if (destinatarioTipoDoc) normalized.destinatarioTipoDoc = destinatarioTipoDoc
  }

  if (payload.destinatarioNroDoc !== undefined) {
    const destinatarioNroDoc = getTrimmedString(payload.destinatarioNroDoc)
    if (destinatarioNroDoc) normalized.destinatarioNroDoc = destinatarioNroDoc
  }

  if (payload.destinatarioRazonSocial !== undefined) {
    const destinatarioRazonSocial = getTrimmedString(payload.destinatarioRazonSocial)
    if (destinatarioRazonSocial) normalized.destinatarioRazonSocial = destinatarioRazonSocial
  }

  if (!partial && motivoActual && ["01", "03", "05", "06", "14", "17"].includes(motivoActual)) {
    if (!getTrimmedString(payload.destinatarioNroDoc) || !getTrimmedString(payload.destinatarioRazonSocial)) {
      return { ok: false, message: "El destinatario es obligatorio para este motivo" }
    }
  }

  if (payload.detalles !== undefined || !partial) {
    const detalles = normalizeArray(payload.detalles, "detalles", normalizeDetalle)
    if (!detalles.ok) {
      return detalles
    }
    if (!partial && detalles.data.length === 0) {
      return { ok: false, message: "La guia debe incluir al menos un detalle" }
    }
    normalized.detalles = detalles.data
  }

  if (payload.conductores !== undefined) {
    const conductores = normalizeArray(payload.conductores, "conductores", normalizeConductor)
    if (!conductores.ok) {
      return conductores
    }
    normalized.conductores = conductores.data
  }

  if (payload.transportistas !== undefined) {
    const transportistas = normalizeArray(
      payload.transportistas,
      "transportistas",
      normalizeTransportista
    )
    if (!transportistas.ok) {
      return transportistas
    }
    normalized.transportistas = transportistas.data
  }

  if (payload.vehiculos !== undefined) {
    const vehiculos = normalizeArray(payload.vehiculos, "vehiculos", normalizeVehiculo)
    if (!vehiculos.ok) {
      return vehiculos
    }
    normalized.vehiculos = vehiculos.data
  }

  if (payload.emitirDirectamente !== undefined) {
    const emitirDirectamente = getBoolean(payload.emitirDirectamente)
    if (emitirDirectamente === null) {
      return { ok: false, message: "emitirDirectamente invalido" }
    }
    normalized.emitirDirectamente = emitirDirectamente
  }

  if (partial && Object.keys(normalized).length === 0) {
    return { ok: false, message: "No hay campos validos para actualizar" }
  }

  return { ok: true, data: normalized }
}

export function getProxyHeaders(
  request: NextRequest,
  options?: { includeJsonContentType?: boolean }
): HeadersInit {
  const headers: HeadersInit = {}
  if (options?.includeJsonContentType) {
    headers["Content-Type"] = "application/json"
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    headers["Authorization"] = authHeader
  }

  return headers
}

export async function parseBackendBody(response: Response, fallbackMessage: string) {
  const text = await response.text()

  let data: Record<string, unknown>
  try {
    const parsed = JSON.parse(text)
    data = asRecord(parsed) ?? { data: parsed }
  } catch {
    data = { message: text || fallbackMessage }
  }

  const message =
    typeof data.message === "string"
      ? data.message
      : typeof data.error === "string"
        ? data.error
        : fallbackMessage

  return { data, message }
}

export function buildForwardQuery(
  request: NextRequest,
  allowedKeys: readonly string[],
  defaults?: Record<string, string>
) {
  const incomingSearchParams = new URL(request.url).searchParams
  const outgoingSearchParams = new URLSearchParams()

  for (const key of allowedKeys) {
    const value = incomingSearchParams.get(key)
    if (value !== null && value !== "") {
      outgoingSearchParams.set(key, value)
    }
  }

  if (defaults) {
    for (const [key, value] of Object.entries(defaults)) {
      if (!outgoingSearchParams.has(key)) {
        outgoingSearchParams.set(key, value)
      }
    }
  }

  const queryString = outgoingSearchParams.toString()
  return queryString ? `?${queryString}` : ""
}

export function ensureBackendUrl() {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  return null
}

export function backendConnectionError() {
  return NextResponse.json(
    { message: "No se pudo conectar al backend. Verifique que este activo." },
    { status: 503 }
  )
}

export function deprecatedEndpointResponse(message: string) {
  return NextResponse.json({ message }, { status: 410 })
}
