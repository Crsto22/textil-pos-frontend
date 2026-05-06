export type SunatAmbiente = "BETA" | "PRODUCCION" | string
export type SunatConfigEstado = "ACTIVO" | "INACTIVO" | string
export type SunatModoIntegracion = "DISABLED" | (string & {})

export interface SunatConfig {
  idSunatConfig: number
  idEmpresa: number
  nombreEmpresa: string
  rucEmpresa: string
  ambiente: SunatAmbiente
  usuarioSol: string
  urlBillService: string
  urlConsultaTicket: string
  urlApiToken: string
  urlApiCpe: string
  certificadoNombreArchivo: string | null
  tieneClaveSol: boolean
  tieneCertificado: boolean
  tieneCertificadoPassword: boolean
  tieneClientId: boolean
  tieneClientSecret: boolean
  igvPorcentaje: number
  activo: SunatConfigEstado
  modoIntegracion: SunatModoIntegracion
  createdAt: string | null
  updatedAt: string | null
}

export interface SunatConfigUpsertRequest {
  ambiente: SunatAmbiente
  usuarioSol: string
  claveSol: string
  urlBillService?: string | null
  urlConsultaTicket?: string | null
  urlApiToken?: string | null
  urlApiCpe?: string | null
  certificadoPassword?: string | null
  clientId?: string | null
  clientSecret?: string | null
  igvPorcentaje: number
  activo: SunatConfigEstado
}

export interface SunatConfigFormValues {
  ambiente: "BETA" | "PRODUCCION"
  usuarioSol: string
  claveSol: string
  urlBillService: string
  urlConsultaTicket: string
  urlApiToken: string
  urlApiCpe: string
  certificadoPassword: string
  clientId: string
  clientSecret: string
  igvPorcentaje: string
  activo: "ACTIVO" | "INACTIVO"
}

export interface SunatConfigTestResponse {
  ok: boolean
  message: string
  ambiente: SunatAmbiente
  usuarioSol: string
  urlBillService: string
  certificadoNombreArchivo: string | null
  claveSolConfigurada: boolean
  certificadoConfigurado: boolean
  certificadoValido: boolean
  certificadoAlias: string | null
  certificadoVigenteDesde: string | null
  certificadoVigenteHasta: string | null
  modoIntegracion: SunatModoIntegracion | null
}
