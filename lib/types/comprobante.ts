export type EstadoComprobante = "ACTIVO" | "INACTIVO" | string

export interface ComprobanteConfig {
  idComprobante: number
  tipoComprobante: string
  serie: string
  ultimoCorrelativo: number
  siguienteCorrelativo: number
  activo: EstadoComprobante
  habilitadoVenta: boolean
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
}

export interface ComprobanteCreateRequest {
  tipoComprobante: string
  serie: string
  ultimoCorrelativo?: number
  activo?: EstadoComprobante
}

export interface ComprobanteUpdateRequest {
  serie: string
  ultimoCorrelativo: number
  activo: EstadoComprobante
}

export interface PageResponse<T> {
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
