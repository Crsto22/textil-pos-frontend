import { memo, type ReactNode } from "react"
import Link from "next/link"
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  EllipsisVerticalIcon,
  ListBulletIcon,
  PlusIcon,
  Squares2X2Icon,
  TagIcon,
} from "@heroicons/react/24/outline"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ProductosViewMode
  onViewModeChange: (v: ProductosViewMode) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-muted/30 p-1">
      <button
        type="button"
        title="Mostrar por cards"
        aria-label="Mostrar por cards"
        onClick={() => onViewModeChange("cards")}
        aria-pressed={viewMode === "cards"}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-colors sm:h-9 sm:w-9",
          viewMode === "cards"
            ? "border-border bg-background text-foreground shadow-sm"
            : "border-transparent bg-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground"
        )}
      >
        <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button
        type="button"
        title="Mostrar en tabla"
        aria-label="Mostrar en tabla"
        onClick={() => onViewModeChange("table")}
        aria-pressed={viewMode === "table"}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-colors sm:h-9 sm:w-9",
          viewMode === "table"
            ? "border-border bg-background text-foreground shadow-sm"
            : "border-transparent bg-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground"
        )}
      >
        <ListBulletIcon className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  )
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
    <div className="flex w-full items-center justify-between gap-2">
      {/* ─── Left: view toggles ─── */}
      <div className="flex items-center gap-2">
        {leftSlot}
        {showViewModeToggle && (
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        )}
      </div>

      {/* ─── Right: actions ─── */}
      <div className="flex shrink-0 items-center gap-2">
        {/* MOBILE: Nuevo + dropdown de acciones secundarias */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link
            href="/productos/nuevo"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
          >
            <PlusIcon className="h-4 w-4" />
            Nuevo
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href="/productos/ofertas" className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-amber-500" />
                  Agregar Oferta
                </Link>
              </DropdownMenuItem>
              {onOpenBarcodeList && (
                <DropdownMenuItem onClick={onOpenBarcodeList}>
                  <svg className="mr-2 h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <path d="M2 4v16M6 4v16M10 4v16M14 4v16M18 4v16M22 4v16" />
                  </svg>
                  Código de Barras
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDownloadExcel ?? undefined}
                disabled={!onDownloadExcel || reportLoading}
              >
                <DocumentArrowDownIcon className="mr-2 h-4 w-4 text-emerald-500" />
                {reportLoading ? "Descargando..." : "Reporte Excel"}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/reportes/productos" className="flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4 text-indigo-500" />
                  Reporte analitico
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/productos/carga-masiva" className="flex items-center gap-2">
                  <DocumentArrowUpIcon className="h-4 w-4 text-emerald-600" />
                  Importar Excel
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* DESKTOP: todos los botones */}
        <div className="hidden shrink-0 flex-wrap items-center justify-end gap-2 sm:flex">
          <Link
            href="/productos/ofertas"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-400"
          >
            <TagIcon className="h-4 w-4" />
            Agregar Oferta
          </Link>
          {onOpenBarcodeList && (
            <button
              type="button"
              onClick={onOpenBarcodeList}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-500/30 bg-slate-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-600"
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
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            {reportLoading ? "Descargando..." : "Reporte Excel"}
          </button>
          <Link
            href="/reportes/productos"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
          >
            <ChartBarIcon className="h-4 w-4" />
            Reporte analitico
          </Link>
          <Link
            href="/productos/carga-masiva"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
          >
            <DocumentArrowUpIcon className="h-4 w-4" />
            Importar Excel
          </Link>
          <Link
            href="/productos/nuevo"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500"
          >
            <PlusIcon className="h-4 w-4" />
            Nuevo Producto
          </Link>
        </div>
      </div>
    </div>
  )
}

export const ProductosHeader = memo(ProductosHeaderComponent)
