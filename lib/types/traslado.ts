// Tipos para el modulo de Traslados

export interface Traslado {
  idTraslado: number
  idSucursalOrigen: number
  nombreSucursalOrigen: string
  idSucursalDestino: number
  nombreSucursalDestino: string
  idProductoVariante: number
  producto: string
  sku: string | null
  color: string
  talla: string
  cantidad: number
  motivo: string | null
  idUsuario: number
  nombreUsuario: string
  fecha: string
}

export interface TrasladoItemRequest {
  idProductoVariante: number
  cantidad: number
}

export interface TrasladoCreateRequest {
  idSucursalOrigen: number
  idSucursalDestino: number
  items: TrasladoItemRequest[]
  motivo?: string | null
}

export interface TrasladoBatchResponse {
  idSucursalOrigen: number
  nombreSucursalOrigen: string
  idSucursalDestino: number
  nombreSucursalDestino: string
  motivo: string | null
  totalItems: number
  totalCantidad: number
  traslados: Traslado[]
}
