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

function booleanOr(value: unknown): boolean {
  return value === true
}

export const emptySunatConfigForm: SunatConfigFormValues = {
  ambiente: "BETA",
  usuarioSol: "",
  claveSol: "",
  urlBillService: "",
  certificadoPassword: "",
  clientId: "",
  clientSecret: "",
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
    certificadoNombreArchivo: stringOrNull(data.certificadoNombreArchivo),
    tieneClaveSol: booleanOr(data.tieneClaveSol),
    tieneCertificado: booleanOr(data.tieneCertificado),
    tieneCertificadoPassword: booleanOr(data.tieneCertificadoPassword),
    tieneClientId: booleanOr(data.tieneClientId),
    tieneClientSecret: booleanOr(data.tieneClientSecret),
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
    activo: values.activo,
  }

  const urlBillService = values.urlBillService.trim()
  const certificadoPassword = values.certificadoPassword.trim()
  const clientId = values.clientId.trim()
  const clientSecret = values.clientSecret.trim()

  payload.urlBillService = urlBillService || null
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
    certificadoPassword: "",
    clientId: "",
    clientSecret: "",
    activo: config.activo === "INACTIVO" ? "INACTIVO" : "ACTIVO",
  }
}

export function isSunatConfigMissing(status: number, message?: string): boolean {
  return status === 404 && (message ?? "").trim() === "No hay configuracion SUNAT registrada"
}
