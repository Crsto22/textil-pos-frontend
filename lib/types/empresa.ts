// Tipos para el modulo de Empresa

export interface EmpresaBase {
  nombre: string
  nombreComercial: string
  ruc: string
  razonSocial: string
  correo: string
  telefono: string
  logoUrl?: string | null
  generaFacturacionElectronica: boolean
}

export interface Empresa extends EmpresaBase {
  idEmpresa: number
  fechaCreacion: string
}

export interface EmpresaPublica {
  nombre: string
  nombreComercial: string
  logoUrl?: string | null
  generaFacturacionElectronica: boolean
}

export interface EmpresaCreateRequest {
  nombre: string
  nombreComercial: string
  ruc: string
  razonSocial: string
  correo: string
  telefono: string
  generaFacturacionElectronica: boolean
}

export interface EmpresaUpdateRequest extends EmpresaCreateRequest {
  logoUrl?: string | null
}
