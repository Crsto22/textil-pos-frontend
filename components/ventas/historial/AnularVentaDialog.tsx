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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import type {
  VentaAnularRequest,
  VentaAnularResult,
  VentaBajaInfo,
} from "@/lib/types/venta"

import { formatComprobante } from "./historial.utils"

const DEFAULT_DESCRIPCION_MOTIVO = "Solicitud de baja"
const SUNAT_BAJA_TIPOS = new Set(["BOLETA", "FACTURA"])

interface AnularVentaDialogProps {
  open: boolean
  detalle: VentaBajaInfo | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: VentaAnularRequest) => Promise<VentaAnularResult>
}

export function AnularVentaDialog({
  open,
  detalle,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: AnularVentaDialogProps) {
  const isMobile = useIsMobile()
  const [descripcionMotivo, setDescripcionMotivo] = useState(DEFAULT_DESCRIPCION_MOTIVO)

  const isSunatBaja = SUNAT_BAJA_TIPOS.has(
    (detalle?.tipoComprobante ?? "").trim().toUpperCase()
  )

  const title = isSunatBaja ? "Solicitar Baja SUNAT" : "Dar de Baja"
  const description = isSunatBaja
    ? "Se registrara una solicitud de baja ante SUNAT. La venta no se anulara de inmediato; quedara pendiente hasta que SUNAT acepte la baja."
    : "Esta accion anulara el comprobante internamente y revertira el stock de forma inmediata."
  const submitLabel = isSunatBaja ? "Solicitar Baja SUNAT" : "Confirmar Baja"
  const submittingLabel = isSunatBaja ? "Enviando baja..." : "Anulando..."

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
  }

  const detalleSummary = detalle ? (
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
  ) : null

  const motivoField = (
    <div className="space-y-2">
      <label htmlFor="anular-venta-motivo" className="text-sm font-medium text-foreground">
        {isSunatBaja ? "Motivo de la baja" : "Motivo"}{" "}
        <span className="text-rose-500">*</span>
      </label>
      <Textarea
        id="anular-venta-motivo"
        value={descripcionMotivo}
        onChange={(event) => setDescripcionMotivo(event.target.value)}
        disabled={isSubmitting}
        maxLength={255}
        placeholder={
          isSunatBaja
            ? "Describe el motivo de la baja SUNAT"
            : "Describe el motivo de la anulacion"
        }
        className="min-h-[112px] resize-none"
      />
      <p className="text-xs text-muted-foreground">
        {isSunatBaja
          ? "Se enviara con codigo `01` como baja total ante SUNAT."
          : "Se enviara con codigo `01` como anulacion total."}
      </p>
    </div>
  )

  const cancelBtn = (
    <button
      type="button"
      onClick={() => onOpenChange(false)}
      disabled={isSubmitting}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      Cancelar
    </button>
  )

  const submitBtn = (
    <button
      type="submit"
      disabled={isSubmitting || !descripcionMotivo.trim()}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:pointer-events-none disabled:opacity-50"
    >
      {isSubmitting ? submittingLabel : submitLabel}
    </button>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex h-auto max-h-[80dvh] flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
              <ExclamationTriangleIcon className="h-5 w-5" />
              {title}
            </SheetTitle>
            <SheetDescription className="text-xs sm:text-sm">{description}</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="min-h-0 flex flex-1 flex-col">
            <div className="space-y-4 overflow-y-auto px-4 py-4">
              {detalleSummary}
              {motivoField}
            </div>
            <SheetFooter className="shrink-0 border-t border-slate-100 px-4 py-4 dark:border-slate-700/60">
              {cancelBtn}
              {submitBtn}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <ExclamationTriangleIcon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            {detalleSummary}
            {motivoField}
          </div>
          <DialogFooter className="mt-4">
            {cancelBtn}
            {submitBtn}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
