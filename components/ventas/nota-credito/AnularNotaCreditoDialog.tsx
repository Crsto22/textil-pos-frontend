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
import { formatComprobante } from "@/components/ventas/historial/historial.utils"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import type {
  NotaCreditoBajaInfo,
  NotaCreditoBajaRequest,
  NotaCreditoBajaResult,
} from "@/lib/types/nota-credito"

const DEFAULT_DESCRIPCION_MOTIVO = "Anulacion de nota de credito por error"

interface AnularNotaCreditoDialogProps {
  open: boolean
  detalle: NotaCreditoBajaInfo | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: NotaCreditoBajaRequest) => Promise<NotaCreditoBajaResult>
}

export function AnularNotaCreditoDialog({
  open,
  detalle,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: AnularNotaCreditoDialogProps) {
  const isMobile = useIsMobile()
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
      <label htmlFor="anular-nota-credito-motivo" className="text-sm font-medium text-foreground">
        Motivo de la baja <span className="text-rose-500">*</span>
      </label>
      <Textarea
        id="anular-nota-credito-motivo"
        value={descripcionMotivo}
        onChange={(event) => setDescripcionMotivo(event.target.value)}
        disabled={isSubmitting}
        maxLength={255}
        placeholder="Describe el motivo de la baja SUNAT"
        className="min-h-[112px] resize-none"
      />
      <p className="text-xs text-muted-foreground">
        Se enviara con codigo `01` como baja total ante SUNAT.
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
      {isSubmitting ? "Enviando baja..." : "Solicitar Baja SUNAT"}
    </button>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex h-auto max-h-[80dvh] flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Solicitar Baja SUNAT
            </SheetTitle>
            <SheetDescription className="text-xs sm:text-sm">
              Se registrara una solicitud de baja ante SUNAT para esta nota de credito.
            </SheetDescription>
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
            Solicitar Baja SUNAT
          </DialogTitle>
          <DialogDescription>
            Se registrara una solicitud de baja ante SUNAT para esta nota de credito.
          </DialogDescription>
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
