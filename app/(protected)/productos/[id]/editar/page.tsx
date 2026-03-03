import { notFound } from "next/navigation"

import { ProductoCreatePage } from "@/components/producto-nuevo/ProductoCreatePage"

interface EditarProductoPageProps {
  params: Promise<{ id: string }>
}

export default async function EditarProductoPage({ params }: EditarProductoPageProps) {
  const { id } = await params
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    notFound()
  }

  return <ProductoCreatePage productoId={parsedId} />
}
