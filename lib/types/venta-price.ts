export type VentaLineaPrecioTipo = "normal" | "oferta" | "mayor"

export interface VentaLineaPrecioOption {
  type: VentaLineaPrecioTipo
  label: string
  precio: number
  description?: string | null
}
