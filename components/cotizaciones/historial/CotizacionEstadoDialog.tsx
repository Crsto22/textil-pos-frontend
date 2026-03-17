import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CotizacionHistorial, CotizacionEstadoUpdateRequest } from "@/lib/types/cotizacion"

interface CotizacionEstadoDialogProps {
  open: boolean
  target: CotizacionHistorial | null
  onOpenChange: (open: boolean) => void
  onSubmit: (idCotizacion: number, estado: CotizacionEstadoUpdateRequest["estado"]) => Promise<boolean>
}

export function CotizacionEstadoDialog({
  open,
  target,
  onOpenChange,
  onSubmit,
}: CotizacionEstadoDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const normalizedEstado = useMemo(
    () => target?.estado.trim().toUpperCase() ?? "",
    [target?.estado]
  )
  const canReactivate = normalizedEstado.length > 0 && !["ACTIVA", "CONVERTIDA"].includes(normalizedEstado)

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return
    onOpenChange(nextOpen)
  }

  const handleSubmit = async () => {
    if (!target || !canReactivate) return
    setSubmitting(true)
    try {
      const success = await onSubmit(target.idCotizacion, "ACTIVA")
      if (success) {
        onOpenChange(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>Reactivar cotizacion</DialogTitle>
          <DialogDescription>
            {canReactivate ? "Confirma si deseas volver a dejar en ACTIVA la cotizacion" : "La cotizacion"}{" "}
            <span className="font-semibold text-foreground">
              {target ? `#${target.idCotizacion}` : ""}
            </span>
            {canReactivate ? "." : " ya no requiere este cambio."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          El sistema solo permite reactivar cotizaciones con el estado <span className="font-semibold text-foreground">ACTIVA</span>. Las cotizaciones convertidas permanecen en <span className="font-semibold text-foreground">CONVERTIDA</span>.
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={submitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={submitting || !canReactivate}>
            {submitting ? "Reactivando..." : "Marcar como ACTIVA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
