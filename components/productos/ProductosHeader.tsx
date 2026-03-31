import { memo, type ReactNode } from "react"
import Link from "next/link"
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
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
  showViewModeToggle?: boolean
  leftSlot?: ReactNode
  onDownloadExcel?: () => void
  reportLoading?: boolean
  onOpenBarcodeList?: () => void
}

function ProductosHeaderComponent({
  viewMode,
  onViewModeChange,
  showViewModeToggle = true,
  leftSlot = null,
  onDownloadExcel,
  reportLoading = false,
  onOpenBarcodeList,
}: ProductosHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {leftSlot}
        {showViewModeToggle && (
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
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Link
          href="/productos/ofertas"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-400 sm:w-auto"
        >
          <TagIcon className="h-4 w-4" />
          Agregar Oferta
        </Link>
        {onOpenBarcodeList && (
          <button
            type="button"
            onClick={onOpenBarcodeList}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-500/30 bg-slate-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-600 sm:w-auto"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M2 4v16M6 4v16M10 4v16M14 4v16M18 4v16M22 4v16" />
            </svg>
            Código de Barras
          </button>
        )}
        <button
          type="button"
          onClick={onDownloadExcel}
          disabled={!onDownloadExcel || reportLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          {reportLoading ? "Descargando..." : "Reporte Excel"}
        </button>
        <Link
          href="/reportes/productos"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 sm:w-auto"
        >
          <ChartBarIcon className="h-4 w-4" />
          Reporte analitico
        </Link>
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
