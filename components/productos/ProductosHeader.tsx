import { memo } from "react"
import Link from "next/link"
import { PlusIcon } from "@heroicons/react/24/outline"

function ProductosHeaderComponent() {
  return (
    <div className="shrink-0">
      <Link
        href="/productos/nuevo"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
      >
        <PlusIcon className="h-4 w-4" />
        Nuevo Producto
      </Link>
    </div>
  )
}

export const ProductosHeader = memo(ProductosHeaderComponent)
