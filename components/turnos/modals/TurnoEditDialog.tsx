import { useEffect, useMemo, useState } from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DIAS_SEMANA, DIA_LABEL, type DiaSemana, type Turno, type TurnoUpdateRequest } from "@/lib/types/turno"

interface TurnoEditDialogProps {
  open: boolean
  turno: Turno | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: TurnoUpdateRequest) => Promise<boolean>
}

function normalizeTime(value: string): string {
  if (!value) return ""
  return value.length === 5 ? `${value}:00` : value
}

function toSeconds(value: string): number {
  const normalized = normalizeTime(value)
  const [hours = "0", minutes = "0", seconds = "0"] = normalized.split(":")
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
}

export function TurnoEditDialog({
  open,
  turno,
  onOpenChange,
  onUpdate,
}: TurnoEditDialogProps) {
  const [form, setForm] = useState<TurnoUpdateRequest>({
    nombre: "",
    horaInicio: "",
    horaFin: "",
    dias: [],
    estado: "ACTIVO",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open || !turno) return

    setForm({
      nombre: turno.nombre,
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      dias: Array.isArray(turno.dias) ? [...turno.dias] : [],
      estado: turno.estado,
    })
  }, [open, turno])

  const hasRequiredFields = useMemo(
    () =>
      form.nombre.trim() !== "" &&
      form.horaInicio.trim() !== "" &&
      form.horaFin.trim() !== "" &&
      form.dias.length > 0,
    [form.dias.length, form.horaFin, form.horaInicio, form.nombre]
  )

  const hasValidTimeRange = useMemo(
    () =>
      form.horaInicio.trim() === "" ||
      form.horaFin.trim() === "" ||
      toSeconds(form.horaFin) > toSeconds(form.horaInicio),
    [form.horaFin, form.horaInicio]
  )

  const isEditValid = hasRequiredFields && hasValidTimeRange

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
  }

  const handleUpdate = async () => {
    if (!turno || !isEditValid) return

    setIsSaving(true)
    try {
      const success = await onUpdate(turno.idTurno, {
        nombre: form.nombre.trim(),
        horaInicio: normalizeTime(form.horaInicio),
        horaFin: normalizeTime(form.horaFin),
        dias: form.dias,
        estado: form.estado,
      })
      if (success) {
        handleOpenChange(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Editar Turno</DialogTitle>
          <DialogDescription>
            Modifica los datos del turno seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="turno-edit-nombre">Nombre</Label>
            <Input
              id="turno-edit-nombre"
              value={form.nombre}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, nombre: event.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="turno-edit-inicio">Hora inicio</Label>
              <Input
                id="turno-edit-inicio"
                type="time"
                step="1"
                value={form.horaInicio.slice(0, 8)}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    horaInicio: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="turno-edit-fin">Hora fin</Label>
              <Input
                id="turno-edit-fin"
                type="time"
                step="1"
                value={form.horaFin.slice(0, 8)}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    horaFin: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Días habilitados</Label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia) => {
                const selected = form.dias.includes(dia)
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        dias: selected
                          ? previous.dias.filter((d) => d !== dia)
                          : ([...previous.dias, dia] as DiaSemana[]),
                      }))
                    }
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {DIA_LABEL[dia]}
                  </button>
                )
              })}
            </div>
            {form.dias.length === 0 ? (
              <p className="text-xs text-red-500">Selecciona al menos un día.</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Estado</p>
              <p className="text-xs text-muted-foreground">
                {form.estado === "ACTIVO" ? "Turno activo" : "Turno inactivo"}
              </p>
            </div>
            <Switch
              checked={form.estado === "ACTIVO"}
              onCheckedChange={(checked) =>
                setForm((previous) => ({
                  ...previous,
                  estado: checked ? "ACTIVO" : "INACTIVO",
                }))
              }
            />
          </div>

          {form.horaInicio && form.horaFin && !hasValidTimeRange ? (
            <p className="text-xs text-red-500">
              La hora fin debe ser mayor a la hora inicio.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleUpdate} disabled={!isEditValid || isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
