// Tipos para el módulo de Empresa

export interface Empresa {
  idEmpresa: number
  nombre: string
  ruc: string
  razonSocial: string
  correo: string
  fechaCreacion: string
  logoUrl?: string
}

export interface EmpresaPublica {
  nombre: string
  logoUrl?: string | null
}
