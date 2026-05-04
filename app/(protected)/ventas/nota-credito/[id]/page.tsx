import { notFound } from "next/navigation"

import { NotaCreditoDetallePage } from "@/components/ventas/nota-credito/NotaCreditoDetallePage"

interface DetalleNotaCreditoPageProps {
  params: Promise<{ id: string }>
}

export default async function DetalleNotaCreditoPage({
  params,
}: DetalleNotaCreditoPageProps) {
  const { id } = await params
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    notFound()
  }

  return <NotaCreditoDetallePage notaCreditoId={parsedId} />
}
