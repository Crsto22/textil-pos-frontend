"use client"

import { VentasHistorialPage } from "@/components/ventas/historial/VentasHistorialPage"

const COMPROBANTES_TIPOS = ["BOLETA", "FACTURA"]

export default function ComprobantesRoute() {
  return <VentasHistorialPage lockedTipos={COMPROBANTES_TIPOS} />
}
