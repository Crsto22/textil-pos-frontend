import { notFound } from "next/navigation"

import { CotizacionPage } from "@/components/cotizaciones/CotizacionPage"

interface EditarCotizacionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditarCotizacionPage({ params }: EditarCotizacionPageProps) {
  const { id } = await params
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    notFound()
  }

  return <CotizacionPage cotizacionId={parsedId} />
}
