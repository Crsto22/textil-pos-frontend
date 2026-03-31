import { notFound } from "next/navigation"

import { VentaDetallePage } from "@/components/ventas/historial/VentaDetallePage"

interface DetalleVentaPageProps {
  params: Promise<{ id: string }>
}

export default async function DetalleVentaPage({ params }: DetalleVentaPageProps) {
  const { id } = await params
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    notFound()
  }

  return <VentaDetallePage ventaId={parsedId} />
}
