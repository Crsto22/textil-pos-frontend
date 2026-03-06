export type EstadoComprobante = "ACTIVO" | "INACTIVO" | string

export interface ComprobanteConfig {
  idComprobante: number
  idSucursal: number
  nombreSucursal: string
  tipoComprobante: string
  serie: string
  ultimoCorrelativo: number
  siguienteCorrelativo: number
  activo: EstadoComprobante
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
}
