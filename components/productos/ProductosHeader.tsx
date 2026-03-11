import { memo } from "react"
import Link from "next/link"
import {
  ArchiveBoxIcon,
  DocumentArrowUpIcon,
  ListBulletIcon,
  PlusIcon,
  Squares2X2Icon,
  TagIcon,
} from "@heroicons/react/24/outline"

import { cn } from "@/lib/utils"

export type ProductosViewMode = "cards" | "table"

interface ProductosHeaderProps {
  viewMode: ProductosViewMode
  onViewModeChange: (nextMode: ProductosViewMode) => void
}

function ProductosHeaderComponent({ viewMode, onViewModeChange }: ProductosHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-muted/30 p-1">
        <button
          type="button"
          title="Mostrar por cards"
          aria-label="Mostrar por cards"
          onClick={() => onViewModeChange("cards")}
          aria-pressed={viewMode === "cards"}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
            viewMode === "cards"
              ? "border-border bg-background text-foreground shadow-sm"
              : "border-transparent bg-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground"
          )}
        >
          <Squares2X2Icon className="h-5 w-5" />
        </button>
        <button
          type="button"
          title="Mostrar en tabla"
          aria-label="Mostrar en tabla"
          onClick={() => onViewModeChange("table")}
          aria-pressed={viewMode === "table"}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
            viewMode === "table"
              ? "border-border bg-background text-foreground shadow-sm"
              : "border-transparent bg-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground"
          )}
        >
          <ListBulletIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Link
          href="/productos/ofertas"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-400 sm:w-auto"
        >
          <TagIcon className="h-4 w-4" />
          Agregar Oferta
        </Link>
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-cyan-500 sm:w-auto"
        >
          <ArchiveBoxIcon className="h-4 w-4" />
          Agregar Stock
        </button>
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
    </div>
  )
}

export const ProductosHeader = memo(ProductosHeaderComponent)
