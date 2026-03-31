"use client"

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { useState } from "react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  getNotaCreditoDownloadConfig,
  openNotaCreditoDocument,
} from "@/lib/nota-credito-documents"
import type {
  VentaAnularRequest,
  VentaAnularResult,
  VentaDetalleResponse,
} from "@/lib/types/venta"

import { formatComprobante } from "./historial.utils"

const DEFAULT_DESCRIPCION_MOTIVO = "Anulacion total de la operacion"
const NOTA_CREDITO_PREVIEWABLE_COMPROBANTES = new Set(["BOLETA", "FACTURA"])

interface AnularVentaDialogProps {
  open: boolean
  detalle: VentaDetalleResponse | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: VentaAnularRequest) => Promise<VentaAnularResult>
}

function canPreviewNotaCredito(tipoComprobante: string | null | undefined): boolean {
  return NOTA_CREDITO_PREVIEWABLE_COMPROBANTES.has((tipoComprobante ?? "").trim().toUpperCase())
}

function shouldOpenNotaCreditoPdf(result: VentaAnularResult): result is VentaAnularResult & {
  response: { tipoAnulacion: string; idNotaCredito: number }
} {
  return (
    result.ok &&
    result.response !== null &&
    result.response.tipoAnulacion?.trim().toUpperCase() === "NOTA_CREDITO" &&
    typeof result.response.idNotaCredito === "number" &&
    result.response.idNotaCredito > 0
  )
}

export function AnularVentaDialog({
  open,
  detalle,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: AnularVentaDialogProps) {
  const [descripcionMotivo, setDescripcionMotivo] = useState(DEFAULT_DESCRIPCION_MOTIVO)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!detalle) return

    const trimmedDescripcion = descripcionMotivo.trim()

    if (!trimmedDescripcion) {
      toast.error("La descripcion del motivo es obligatoria")
      return
    }

    if (trimmedDescripcion.length < 5) {
      toast.error("La descripcion del motivo debe tener al menos 5 caracteres")
      return
    }

    if (trimmedDescripcion.length > 255) {
      toast.error("La descripcion del motivo no puede exceder los 255 caracteres")
      return
    }

    const result = await onConfirm({
      codigoMotivo: "01",
      descripcionMotivo: trimmedDescripcion,
    })

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    onOpenChange(false)
    toast.success(result.message)

    if (!canPreviewNotaCredito(detalle.tipoComprobante) || !shouldOpenNotaCreditoPdf(result)) {
      return
    }

    const notaCreditoDocument = await openNotaCreditoDocument(
      getNotaCreditoDownloadConfig("pdf", {
        idNotaCredito: result.response.idNotaCredito,
      })
    )

    if (!notaCreditoDocument.ok) {
      toast.error("La anulacion fue exitosa, pero no se pudo abrir el PDF de la nota de credito.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <ExclamationTriangleIcon className="h-5 w-5" />
            Confirmar anulacion de venta
          </DialogTitle>
          <DialogDescription>
            Esta accion anulara el comprobante y puede revertir stock o disparar el flujo
            tributario segun el tipo de documento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {detalle ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100">
              <p className="font-semibold">
                {detalle.tipoComprobante} {formatComprobante(detalle)}
              </p>
              <p className="mt-1 text-rose-800/80 dark:text-rose-100/80">
                Cliente: {detalle.nombreCliente}
              </p>
              <p className="mt-1 text-rose-800/80 dark:text-rose-100/80">
                Total: {detalle.moneda} {detalle.total.toFixed(2)}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="anular-venta-motivo" className="text-sm font-medium text-foreground">
              Motivo de anulacion <span className="text-rose-500">*</span>
            </label>
            <Textarea
              id="anular-venta-motivo"
              value={descripcionMotivo}
              onChange={(event) => setDescripcionMotivo(event.target.value)}
              disabled={isSubmitting}
              maxLength={255}
              placeholder="Describe el motivo de la anulacion"
              className="min-h-[112px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Se enviara con codigo `01` como anulacion total.
            </p>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !descripcionMotivo.trim()}
              className="inline-flex h-10 items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? "Anulando..." : "Confirmar anulacion"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
