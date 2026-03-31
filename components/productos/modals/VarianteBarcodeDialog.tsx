"use client"

import { useCallback, useMemo, useState } from "react"
import { Download, Minus, Plus, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { CatalogVariantItem } from "@/lib/catalog-view"

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
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function buildBarcodeSvg(codigoBarras: string, sku: string | null): string | null {
  const skuText = `SKU: ${sku ?? "N/A"}`
  return (
    buildEan13SvgMarkup(codigoBarras, { skuLabel: skuText }) ??
    buildBarcodeSvgMarkup(codigoBarras)
  )
}

function buildPrintHtml(
  svgMarkup: string,
  label: string,
  qty: number,
  format: PaperFormat
): string {
  const cfg = PAPER_FORMATS[format]
  const escapedLabel = escapeHtml(label)
  const card = `<div class="card"><p class="label">${escapedLabel}</p>${svgMarkup}</div>`
  const cards = Array.from({ length: qty }, () => card).join("")

  return `<!DOCTYPE html>
<html>
<head>
  <title>Código de Barras</title>
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
// Dialog
// ---------------------------------------------------------------------------

interface VarianteBarcodeDialogProps {
  open: boolean
  target: CatalogVariantItem | null
  onOpenChange: (open: boolean) => void
}

export function VarianteBarcodeDialog({
  open,
  target,
  onOpenChange,
}: VarianteBarcodeDialogProps) {
  const codigoBarras = target?.codigoBarras ?? ""
  const sku = target?.sku ?? null

  const barcodeSvgMarkup = useMemo(
    () => (codigoBarras ? buildBarcodeSvg(codigoBarras, sku) : null),
    [codigoBarras, sku]
  )

  const [paperFormat, setPaperFormat] = useState<PaperFormat>("a4")
  const [quantity, setQuantity] = useState(1)

  const handleDecrease = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }, [])

  const handleIncrease = useCallback(() => {
    setQuantity((prev) => prev + 1)
  }, [])

  const variantLabel = target
    ? `${target.productName} - ${target.colorName} / ${target.tallaName}`
    : ""

  const createSvgBlob = () =>
    new Blob([barcodeSvgMarkup ?? ""], {
      type: "image/svg+xml;charset=utf-8",
    })

  const createPngDataUrl = () =>
    new Promise<string | null>((resolve) => {
      if (!barcodeSvgMarkup) {
        resolve(null)
        return
      }

      const url = URL.createObjectURL(createSvgBlob())
      const image = new Image()

      image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = image.naturalWidth || image.width
        canvas.height = image.naturalHeight || image.height

        const context = canvas.getContext("2d")
        if (!context) {
          URL.revokeObjectURL(url)
          resolve(null)
          return
        }

        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL("image/png"))
      }

      image.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }

      image.src = url
    })

  const handleDownload = async () => {
    if (!barcodeSvgMarkup) return

    const dataUrl = await createPngDataUrl()
    if (!dataUrl) return

    const link = document.createElement("a")
    link.download = `barcode-${codigoBarras}.png`
    link.href = dataUrl
    link.click()
  }

  const handlePrint = useCallback(() => {
    if (!barcodeSvgMarkup) return

    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return

    printWindow.document.write(
      buildPrintHtml(barcodeSvgMarkup, variantLabel, quantity, paperFormat)
    )
    printWindow.document.close()
  }, [barcodeSvgMarkup, variantLabel, quantity, paperFormat])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Código de Barras</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {variantLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-full overflow-hidden rounded-xl border bg-white p-4 shadow-sm dark:border-white dark:bg-white">
            <p className="mb-2 truncate text-center text-[10px] font-medium text-slate-500">
              {variantLabel}
            </p>
            {barcodeSvgMarkup ? (
              <div
                className="[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: barcodeSvgMarkup }}
              />
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                No se pudo generar la vista previa para este código de barras.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
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

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Cantidad:
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[28px] text-center text-sm font-semibold text-slate-700">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-200"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleDownload}
            disabled={!barcodeSvgMarkup}
          >
            <Download className="h-4 w-4" />
            Descargar
          </Button>
          <Button
            type="button"
            className="gap-2 bg-rose-500 text-white hover:bg-rose-400"
            onClick={handlePrint}
            disabled={!barcodeSvgMarkup}
          >
            <Printer className="h-4 w-4" />
            Imprimir {quantity} etiqueta{quantity !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
