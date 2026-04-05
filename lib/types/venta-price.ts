export type VentaLineaPrecioTipo = "normal" | "oferta" | "mayor" | "editado"

export interface VentaLineaPrecioOption {
  type: VentaLineaPrecioTipo
  label: string
  precio: number
  description?: string | null
}
