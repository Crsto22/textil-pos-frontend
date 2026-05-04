import { notFound } from "next/navigation"

import { GuiaRemisionDetallePage } from "@/components/ventas/guia-remision/GuiaRemisionDetallePage"

interface DetalleGuiaRemisionPageProps {
  params: Promise<{ id: string }>
}

export default async function DetalleGuiaRemisionPage({ params }: DetalleGuiaRemisionPageProps) {
  const { id } = await params
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    notFound()
  }

  return <GuiaRemisionDetallePage guiaId={parsedId} />
}
