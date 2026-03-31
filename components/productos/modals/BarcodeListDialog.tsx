"use client"

import { useCallback, useMemo, useState } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { Check, Minus, Plus, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buildBarcodeSvgMarkup, buildEan13SvgMarkup } from "@/lib/barcode-renderer"
import {
  useBarcodeVariantes,
  type BarcodeVariante,
} from "@/lib/hooks/useBarcodeVariantes"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function BarcodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M2 4v16M6 4v16M10 4v16M14 4v16M18 4v16M22 4v16" />
    </svg>
  )
}

function buildVariantLabel(item: BarcodeVariante): string {
  return `${item.productoNombre} - ${item.colorNombre} / ${item.tallaNombre}`
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function buildBarcodeSvg(item: BarcodeVariante): string | null {
  const skuText = `SKU: ${item.sku ?? "N/A"}`
  return (
    buildEan13SvgMarkup(item.codigoBarras, { skuLabel: skuText }) ??
    buildBarcodeSvgMarkup(item.codigoBarras)
  )
}

// ---------------------------------------------------------------------------
// Paper formats
// ---------------------------------------------------------------------------

type PaperFormat = "a4" | "carta" | "ticket80"

interface PaperFormatConfig {
  label: string
  pageSize: string
  columns: number
  bodyPadding: string
  gap: string
  printPadding: string
  printGap: string
  labelFontSize: string
}

const PAPER_FORMATS: Record<PaperFormat, PaperFormatConfig> = {
  a4: {
    label: "A4 (Genérico)",
    pageSize: "A4",
    columns: 3,
    bodyPadding: "12mm",
    gap: "6mm",
    printPadding: "8mm",
    printGap: "4mm",
    labelFontSize: "8px",
  },
  carta: {
    label: "Carta (Genérico)",
    pageSize: "letter",
    columns: 3,
    bodyPadding: "12mm",
    gap: "6mm",
    printPadding: "8mm",
    printGap: "4mm",
    labelFontSize: "8px",
  },
  ticket80: {
    label: "Ticket 80mm",
    pageSize: "80mm 297mm",
    columns: 1,
    bodyPadding: "2mm",
    gap: "3mm",
    printPadding: "1mm",
    printGap: "2mm",
    labelFontSize: "7px",
  },
}

const PAPER_FORMAT_OPTIONS: { value: PaperFormat; label: string }[] = [
  { value: "a4", label: "A4 (Genérico)" },
  { value: "carta", label: "Carta (Genérico)" },
  { value: "ticket80", label: "Ticket 80mm" },
]

// ---------------------------------------------------------------------------
// Print HTML builder
// ---------------------------------------------------------------------------

interface PrintEntry {
  item: BarcodeVariante
  qty: number
}

function buildPrintHtml(entries: PrintEntry[], format: PaperFormat): string {
  const cfg = PAPER_FORMATS[format]
  const cards = entries
    .flatMap(({ item, qty }) => {
      const svg = buildBarcodeSvg(item)
      if (!svg) return []
      const label = escapeHtml(buildVariantLabel(item))
      const card = `<div class="card"><p class="label">${label}</p>${svg}</div>`
      return Array.from({ length: qty }, () => card)
    })
    .join("")

  return `<!DOCTYPE html>
<html>
<head>
  <title>Códigos de Barras</title>
  <style>
    @page{size:${cfg.pageSize};margin:0}
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#fff;padding:${cfg.bodyPadding};font-family:sans-serif}
    .grid{display:grid;grid-template-columns:repeat(${cfg.columns},1fr);gap:${cfg.gap}}
    .card{padding:3mm;text-align:center;page-break-inside:avoid}
    .label{font-size:${cfg.labelFontSize};color:#666;margin-bottom:2mm;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    svg{max-width:100%;height:auto}
    @media print{body{padding:${cfg.printPadding}}.grid{gap:${cfg.printGap}}}
  </style>
</head>
<body>
  <div class="grid">${cards}</div>
  <script>window.onload=function(){window.print()}<\/script>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Barcode Card
// ---------------------------------------------------------------------------

interface BarcodeCardProps {
  item: BarcodeVariante
  selectionMode: boolean
  selected: boolean
  quantity: number
  onToggleSelect: (item: BarcodeVariante) => void
  onQuantityChange: (id: number, delta: number) => void
}

function BarcodeCard({
  item,
  selectionMode,
  selected,
  quantity,
  onToggleSelect,
  onQuantityChange,
}: BarcodeCardProps) {
  const svgMarkup = useMemo(() => buildBarcodeSvg(item), [item])

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white shadow-sm transition dark:border-white dark:bg-white",
        selectionMode && "cursor-pointer",
        selectionMode && selected && "ring-2 ring-rose-500"
      )}
      onClick={selectionMode ? () => onToggleSelect(item) : undefined}
    >
      {selectionMode && selected && (
        <div className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white">
          <Check className="h-3 w-3" />
        </div>
      )}

      <div className="border-b border-slate-100 px-3 py-1.5">
        <p className="truncate text-center text-[10px] font-medium text-slate-500">
          {buildVariantLabel(item)}
        </p>
      </div>
      <div className="p-4">
        {svgMarkup ? (
          <div
            className="[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : (
          <div className="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No se pudo generar el código de barras
          </div>
        )}
      </div>

      {selectionMode && selected && (
        <div
          className="flex items-center justify-center gap-3 border-t border-slate-100 bg-slate-50 px-3 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onQuantityChange(item.idProductoVariante, -1)}
            disabled={quantity <= 1}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="min-w-[24px] text-center text-sm font-semibold text-slate-700">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(item.idProductoVariante, 1)}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-200"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

function BarcodeCardSkeleton() {
  return (
    <div className="h-40 animate-pulse rounded-xl border bg-slate-100 dark:border-slate-700 dark:bg-white" />
  )
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

interface BarcodeListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  idSucursal?: number | null
}

export function BarcodeListDialog({
  open,
  onOpenChange,
  idSucursal,
}: BarcodeListDialogProps) {
  const { items, loading, search, setSearch, page, setPage, totalPages, totalWithBarcode } =
    useBarcodeVariantes(open, idSucursal)

  const [selectionMode, setSelectionMode] = useState(false)
  const [paperFormat, setPaperFormat] = useState<PaperFormat>("a4")
  const [selections, setSelections] = useState<Record<number, { item: BarcodeVariante; qty: number }>>({})

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (prev) setSelections({})
      return !prev
    })
  }, [])

  const toggleSelect = useCallback((item: BarcodeVariante) => {
    setSelections((prev) => {
      const next = { ...prev }
      if (item.idProductoVariante in next) {
        delete next[item.idProductoVariante]
      } else {
        next[item.idProductoVariante] = { item, qty: 1 }
      }
      return next
    })
  }, [])

  const changeQuantity = useCallback((id: number, delta: number) => {
    setSelections((prev) => {
      const entry = prev[id]
      if (!entry) return prev
      const next = Math.max(1, entry.qty + delta)
      return { ...prev, [id]: { ...entry, qty: next } }
    })
  }, [])

  const totalLabels = useMemo(
    () => Object.values(selections).reduce((sum, entry) => sum + entry.qty, 0),
    [selections]
  )

  const handlePrintAll = useCallback(() => {
    if (items.length === 0) return
    const entries: PrintEntry[] = items.map((item) => ({ item, qty: 1 }))
    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return
    printWindow.document.write(buildPrintHtml(entries, paperFormat))
    printWindow.document.close()
  }, [items, paperFormat])

  const handlePrintSelected = useCallback(() => {
    const entries: PrintEntry[] = Object.values(selections).map((entry) => ({
      item: entry.item,
      qty: entry.qty,
    }))
    if (entries.length === 0) return
    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return
    printWindow.document.write(buildPrintHtml(entries, paperFormat))
    printWindow.document.close()
  }, [paperFormat, selections])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarcodeIcon className="h-5 w-5" />
            Códigos de Barras de Productos
          </DialogTitle>
          <DialogDescription>
            {loading
              ? "Cargando variantes..."
              : `${totalWithBarcode} producto(s) con código de barras`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handlePrintAll}
            disabled={loading || items.length === 0 || selectionMode}
            className="gap-2 bg-rose-500 text-white hover:bg-rose-400"
          >
            <Printer className="h-4 w-4" />
            Imprimir Todos
          </Button>

          <Button
            type="button"
            variant={selectionMode ? "default" : "outline"}
            onClick={toggleSelectionMode}
            disabled={loading || items.length === 0}
            className={cn(
              "gap-2",
              selectionMode && "bg-blue-600 text-white hover:bg-blue-500"
            )}
          >
            <Check className="h-4 w-4" />
            Seleccionar cantidades
          </Button>

          {selectionMode && totalLabels > 0 && (
            <Button
              type="button"
              onClick={handlePrintSelected}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Printer className="h-4 w-4" />
              Imprimir {totalLabels} etiqueta{totalLabels !== 1 ? "s" : ""}
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Formato:
            </span>
            <Select
              value={paperFormat}
              onValueChange={(value) => setPaperFormat(value as PaperFormat)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAPER_FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <BarcodeCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
              <BarcodeIcon className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No se encontraron productos con código de barras
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((item) => (
                <BarcodeCard
                  key={item.idProductoVariante}
                  item={item}
                  selectionMode={selectionMode}
                  selected={item.idProductoVariante in selections}
                  quantity={selections[item.idProductoVariante]?.qty ?? 1}
                  onToggleSelect={toggleSelect}
                  onQuantityChange={changeQuantity}
                />
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Anterior
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Siguiente
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
