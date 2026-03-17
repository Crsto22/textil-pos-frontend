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
  certificadoNombreArchivo: string | null
  tieneClaveSol: boolean
  tieneCertificado: boolean
  tieneCertificadoPassword: boolean
  tieneClientId: boolean
  tieneClientSecret: boolean
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
  certificadoPassword?: string | null
  clientId?: string | null
  clientSecret?: string | null
  activo: SunatConfigEstado
}

export interface SunatConfigFormValues {
  ambiente: "BETA" | "PRODUCCION"
  usuarioSol: string
  claveSol: string
  urlBillService: string
  certificadoPassword: string
  clientId: string
  clientSecret: string
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
