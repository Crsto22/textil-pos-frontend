// Tipos para el modulo de Empresa

export interface EmpresaBase {
  nombre: string
  nombreComercial: string
  ruc: string
  razonSocial: string
  correo: string
  telefono: string
  direccion: string
  ubigeo: string
  departamento: string
  provincia: string
  distrito: string
  codigoEstablecimientoSunat: string
  logoUrl?: string | null
  generaFacturacionElectronica: boolean
}

export interface Empresa extends EmpresaBase {
  idEmpresa: number
  fechaCreacion: string
}

export type EmpresaLocationFields = Pick<
  EmpresaBase,
  "ubigeo" | "departamento" | "provincia" | "distrito"
>

export interface EmpresaPublica {
  nombreComercial: string
  logoUrl?: string | null
}

export interface EmpresaCreateRequest extends EmpresaBase {}

export interface EmpresaUpdateRequest extends EmpresaCreateRequest {
  logoUrl?: string | null
}
