import { useEffect, useState } from "react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CotizacionHistorial, CotizacionEstadoUpdateRequest } from "@/lib/types/cotizacion"

const ESTADO_OPTIONS: Array<{ value: CotizacionEstadoUpdateRequest["estado"]; label: string }> = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "APROBADA", label: "Aprobada" },
  { value: "RECHAZADA", label: "Rechazada" },
  { value: "VENCIDA", label: "Vencida" },
]

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
  const [estado, setEstado] = useState<CotizacionEstadoUpdateRequest["estado"]>("BORRADOR")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !target) return
    const estadoActual = target.estado.trim().toUpperCase()
    const option = ESTADO_OPTIONS.find((item) => item.value === estadoActual)
    setEstado(option?.value ?? "BORRADOR")
  }, [open, target])

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return
    onOpenChange(nextOpen)
  }

  const handleSubmit = async () => {
    if (!target) return
    setSubmitting(true)
    try {
      const success = await onSubmit(target.idCotizacion, estado)
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
          <DialogTitle>Cambiar estado</DialogTitle>
          <DialogDescription>
            Actualiza el estado de la cotizacion{" "}
            <span className="font-semibold text-foreground">
              {target ? `#${target.idCotizacion}` : ""}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nuevo estado</label>
          <Select
            value={estado}
            onValueChange={(value) => setEstado(value as CotizacionEstadoUpdateRequest["estado"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={submitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Guardando..." : "Guardar estado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
