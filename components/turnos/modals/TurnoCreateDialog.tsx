import { useCallback, useEffect, useState } from "react"

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
import { TurnoSpecialSchedules } from "@/components/turnos/TurnoSpecialSchedules"
import { DIAS_SEMANA, DIA_LABEL, type DiaSemana, type TurnoCreateRequest } from "@/lib/types/turno"
import {
  buildHorariosDiasPayload,
  hasValidTurnoTimeRange,
  normalizeTurnoTime,
} from "@/lib/turno-schedule-utils"

interface TurnoCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: TurnoCreateRequest) => Promise<boolean>
}

export function TurnoCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: TurnoCreateDialogProps) {
  const buildInitialForm = useCallback(
    (): TurnoCreateRequest => ({
      nombre: "",
      horaInicio: "",
      horaFin: "",
      toleranciaMinutos: 10,
      dias: [],
      horariosDias: [],
    }),
    []
  )

  const [form, setForm] = useState<TurnoCreateRequest>(buildInitialForm)
  const [isSaving, setIsSaving] = useState(false)

  const hasRequiredFields =
    form.nombre.trim() !== "" &&
    form.horaInicio.trim() !== "" &&
    form.horaFin.trim() !== "" &&
    form.dias.length > 0
  const hasValidTimeRange =
    hasValidTurnoTimeRange(form.horaInicio, form.horaFin)
  const selectedDias = new Set(form.dias)
  const activeHorariosDias = (form.horariosDias ?? []).filter((horario) =>
    selectedDias.has(horario.dia)
  )
  const hasValidSpecialSchedules = activeHorariosDias.every(
    (horario) =>
      horario.horaInicio.trim() !== "" &&
      horario.horaFin.trim() !== "" &&
      hasValidTurnoTimeRange(horario.horaInicio, horario.horaFin)
  )
  const isCreateValid = hasRequiredFields && hasValidTimeRange && hasValidSpecialSchedules

  useEffect(() => {
    if (!open) return
    setForm(buildInitialForm())
  }, [buildInitialForm, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(buildInitialForm())
    }
  }

  const handleCreate = async () => {
    if (!isCreateValid) return

    setIsSaving(true)
    try {
      const horariosDias = buildHorariosDiasPayload(activeHorariosDias)
      const success = await onCreate({
        nombre: form.nombre.trim(),
        horaInicio: normalizeTurnoTime(form.horaInicio),
        horaFin: normalizeTurnoTime(form.horaFin),
        toleranciaMinutos: form.toleranciaMinutos,
        dias: form.dias,
        ...(horariosDias.length > 0 ? { horariosDias } : {}),
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
      <DialogContent className="sm:max-w-[640px]" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Nuevo Turno</DialogTitle>
          <DialogDescription>
            Completa los datos para crear un nuevo turno.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="turno-create-nombre">Nombre</Label>
            <Input
              id="turno-create-nombre"
              placeholder="Ej. Manana"
              value={form.nombre}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, nombre: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="turno-create-tolerancia">Tolerancia (minutos)</Label>
            <Input
              id="turno-create-tolerancia"
              type="number"
              min={0}
              max={180}
              value={form.toleranciaMinutos}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  toleranciaMinutos: Math.min(180, Math.max(0, Number(event.target.value))),
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="turno-create-inicio">Hora inicio</Label>
              <Input
                id="turno-create-inicio"
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
              <Label htmlFor="turno-create-fin">Hora fin</Label>
              <Input
                id="turno-create-fin"
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

          {form.horaInicio && form.horaFin && !hasValidTimeRange ? (
            <p className="text-xs text-red-500">
              La hora fin debe ser mayor a la hora inicio.
            </p>
          ) : null}

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
                        horariosDias: selected
                          ? (previous.horariosDias ?? []).filter((horario) => horario.dia !== dia)
                          : previous.horariosDias,
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

          <TurnoSpecialSchedules
            dias={form.dias}
            horariosDias={form.horariosDias}
            onChange={(horariosDias) =>
              setForm((previous) => ({
                ...previous,
                horariosDias,
              }))
            }
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleCreate} disabled={!isCreateValid || isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
