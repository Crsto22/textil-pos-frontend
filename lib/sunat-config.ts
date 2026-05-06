import type {
  SunatConfig,
  SunatConfigFormValues,
  SunatConfigTestResponse,
  SunatConfigUpsertRequest,
} from "@/lib/types/sunat-config"

function stringOr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback
}

function stringOrNull(value: unknown): string | null {
  const normalized = stringOr(value)
  return normalized.length > 0 ? normalized : null
}

function numberOr(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseIgvPorcentaje(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 18
  if (parsed < 0) return 0
  if (parsed > 100) return 100
  return parsed
}

function booleanOr(value: unknown): boolean {
  return value === true
}

export const emptySunatConfigForm: SunatConfigFormValues = {
  ambiente: "BETA",
  usuarioSol: "",
  claveSol: "",
  urlBillService: "",
  urlConsultaTicket: "",
  urlApiToken: "",
  urlApiCpe: "",
  certificadoPassword: "",
  clientId: "",
  clientSecret: "",
  igvPorcentaje: "18",
  activo: "ACTIVO",
}

export function normalizeSunatConfig(value: unknown): SunatConfig | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>
  const idSunatConfig = numberOr(data.idSunatConfig)
  const idEmpresa = numberOr(data.idEmpresa)

  if (idSunatConfig <= 0 || idEmpresa <= 0) return null

  return {
    idSunatConfig,
    idEmpresa,
    nombreEmpresa: stringOr(data.nombreEmpresa),
    rucEmpresa: stringOr(data.rucEmpresa),
    ambiente: stringOr(data.ambiente, "BETA"),
    usuarioSol: stringOr(data.usuarioSol),
    urlBillService: stringOr(data.urlBillService),
    urlConsultaTicket: stringOr(data.urlConsultaTicket),
    urlApiToken: stringOr(data.urlApiToken),
    urlApiCpe: stringOr(data.urlApiCpe),
    certificadoNombreArchivo: stringOrNull(data.certificadoNombreArchivo),
    tieneClaveSol: booleanOr(data.tieneClaveSol),
    tieneCertificado: booleanOr(data.tieneCertificado),
    tieneCertificadoPassword: booleanOr(data.tieneCertificadoPassword),
    tieneClientId: booleanOr(data.tieneClientId),
    tieneClientSecret: booleanOr(data.tieneClientSecret),
    igvPorcentaje: parseIgvPorcentaje(data.igvPorcentaje),
    activo: stringOr(data.activo, "ACTIVO"),
    modoIntegracion: stringOr(data.modoIntegracion, "DISABLED"),
    createdAt: stringOrNull(data.createdAt),
    updatedAt: stringOrNull(data.updatedAt),
  }
}

export function normalizeSunatConfigTestResponse(
  value: unknown
): SunatConfigTestResponse | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>
  const message = stringOr(data.message)
  if (!message) return null

  return {
    ok: booleanOr(data.ok),
    message,
    ambiente: stringOr(data.ambiente, "BETA"),
    usuarioSol: stringOr(data.usuarioSol),
    urlBillService: stringOr(data.urlBillService),
    certificadoNombreArchivo: stringOrNull(data.certificadoNombreArchivo),
    claveSolConfigurada: booleanOr(data.claveSolConfigurada),
    certificadoConfigurado: booleanOr(data.certificadoConfigurado),
    certificadoValido: booleanOr(data.certificadoValido),
    certificadoAlias: stringOrNull(data.certificadoAlias),
    certificadoVigenteDesde: stringOrNull(data.certificadoVigenteDesde),
    certificadoVigenteHasta: stringOrNull(data.certificadoVigenteHasta),
    modoIntegracion: stringOrNull(data.modoIntegracion),
  }
}

export function buildSunatConfigPayload(
  values: SunatConfigFormValues
): SunatConfigUpsertRequest {
  const payload: SunatConfigUpsertRequest = {
    ambiente: values.ambiente,
    usuarioSol: values.usuarioSol.trim(),
    claveSol: values.claveSol,
    igvPorcentaje: parseIgvPorcentaje(values.igvPorcentaje),
    activo: values.activo,
  }

  const urlBillService = values.urlBillService.trim()
  const urlConsultaTicket = values.urlConsultaTicket.trim()
  const urlApiToken = values.urlApiToken.trim()
  const urlApiCpe = values.urlApiCpe.trim()
  const certificadoPassword = values.certificadoPassword.trim()
  const clientId = values.clientId.trim()
  const clientSecret = values.clientSecret.trim()

  payload.urlBillService = urlBillService || null
  payload.urlConsultaTicket = urlConsultaTicket || null
  payload.urlApiToken = urlApiToken || null
  payload.urlApiCpe = urlApiCpe || null
  payload.certificadoPassword = certificadoPassword || null
  payload.clientId = clientId || null
  payload.clientSecret = clientSecret || null

  return payload
}

export function mapSunatConfigToForm(
  config: SunatConfig | null
): SunatConfigFormValues {
  if (!config) return { ...emptySunatConfigForm }

  return {
    ambiente: config.ambiente === "PRODUCCION" ? "PRODUCCION" : "BETA",
    usuarioSol: config.usuarioSol,
    claveSol: "",
    urlBillService: config.urlBillService,
    urlConsultaTicket: config.urlConsultaTicket,
    urlApiToken: config.urlApiToken,
    urlApiCpe: config.urlApiCpe,
    certificadoPassword: "",
    clientId: "",
    clientSecret: "",
    igvPorcentaje: String(config.igvPorcentaje),
    activo: config.activo === "INACTIVO" ? "INACTIVO" : "ACTIVO",
  }
}

export function isSunatConfigMissing(status: number, message?: string): boolean {
  return status === 404 && (message ?? "").trim() === "No hay configuracion SUNAT registrada"
}
