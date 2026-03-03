import { memo } from "react"
import Link from "next/link"
import { DocumentArrowUpIcon, PlusIcon } from "@heroicons/react/24/outline"

function ProductosHeaderComponent() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Link
        href="/productos/carga-masiva"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500 sm:w-auto"
      >
        <DocumentArrowUpIcon className="h-4 w-4" />
        Importar Excel
      </Link>
      <Link
        href="/productos/nuevo"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 sm:w-auto"
      >
        <PlusIcon className="h-4 w-4" />
        Nuevo Producto
      </Link>
    </div>
  )
}

export const ProductosHeader = memo(ProductosHeaderComponent)
