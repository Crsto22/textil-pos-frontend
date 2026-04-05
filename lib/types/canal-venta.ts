// Tipos para el modulo de Canal de Venta

export type CanalVentaPlataforma =
  | "TIKTOK"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "MERCADOLIBRE"
  | "WEB"
  | (string & {})

export interface CanalVenta {
  idCanalVenta: number
  idSucursal: number
  nombreSucursal: string
  tipoSucursal: string
  nombre: string
  plataforma: CanalVentaPlataforma
  descripcion: string | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface CanalVentaCreateRequest {
  idSucursal: number
  nombre: string
  plataforma: CanalVentaPlataforma
  descripcion?: string | null
  activo: boolean
}

export type CanalVentaUpdateRequest = CanalVentaCreateRequest

export interface CanalVentaDeleteResponse {
  message: string
}
