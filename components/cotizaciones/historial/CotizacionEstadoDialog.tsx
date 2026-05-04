import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="flex h-auto max-h-[70dvh] flex-col gap-0 p-0">
        <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
          <SheetTitle className="text-sm">Reactivar cotizacion</SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            {canReactivate ? "Confirma si deseas volver a dejar en ACTIVA la cotizacion" : "La cotizacion"}{" "}
            <span className="font-semibold text-foreground">
              {target ? `#${target.idCotizacion}` : ""}
            </span>
            {canReactivate ? "." : " ya no requiere este cambio."}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4">
          <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          El sistema solo permite reactivar cotizaciones con el estado <span className="font-semibold text-foreground">ACTIVA</span>. Las cotizaciones convertidas permanecen en <span className="font-semibold text-foreground">CONVERTIDA</span>.
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-slate-100 px-4 py-4 dark:border-slate-700/60">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={submitting} className="h-11">
              Cancelar
            </Button>
          </SheetClose>
          <Button type="button" onClick={handleSubmit} disabled={submitting || !canReactivate} className="h-11">
            {submitting ? "Reactivando..." : "Marcar como ACTIVA"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
