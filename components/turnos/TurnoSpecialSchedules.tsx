import { ClockIcon, XMarkIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DIA_LABEL, type DiaSemana, type TurnoHorarioDia } from "@/lib/types/turno"
import { hasValidTurnoTimeRange } from "@/lib/turno-schedule-utils"

interface TurnoSpecialSchedulesProps {
  dias: DiaSemana[]
  horariosDias?: TurnoHorarioDia[]
  onChange: (horariosDias: TurnoHorarioDia[]) => void
}

function getHorarioForDia(horariosDias: TurnoHorarioDia[] | undefined, dia: DiaSemana) {
  return horariosDias?.find((horario) => horario.dia === dia) ?? null
}

export function TurnoSpecialSchedules({
  dias,
  horariosDias = [],
  onChange,
}: TurnoSpecialSchedulesProps) {
  const enabledDias = new Set(dias)
  const visibleHorarios = horariosDias.filter((horario) => enabledDias.has(horario.dia))
  const availableDias = dias.filter((dia) => !getHorarioForDia(visibleHorarios, dia))

  const addHorario = (dia: DiaSemana) => {
    onChange([
      ...visibleHorarios,
      {
        dia,
        horaInicio: "",
        horaFin: "",
      },
    ])
  }

  const updateHorario = (
    dia: DiaSemana,
    field: "horaInicio" | "horaFin",
    value: string
  ) => {
    onChange(
      visibleHorarios.map((horario) =>
        horario.dia === dia ? { ...horario, [field]: value } : horario
      )
    )
  }

  const removeHorario = (dia: DiaSemana) => {
    onChange(visibleHorarios.filter((horario) => horario.dia !== dia))
  }

  return (
    <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-sm">Horarios especiales por dia</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Solo agrega los dias que no usan el horario base.
          </p>
        </div>
        {availableDias.length > 0 ? (
          <select
            value=""
            onChange={(event) => {
              const dia = event.target.value as DiaSemana
              if (dia) addHorario(dia)
            }}
            className="h-9 rounded-md border bg-background px-2 text-xs outline-none transition focus:border-primary"
          >
            <option value="">Agregar dia</option>
            {availableDias.map((dia) => (
              <option key={dia} value={dia}>
                {DIA_LABEL[dia]}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {dias.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Selecciona dias habilitados para agregar horarios especiales.
        </p>
      ) : visibleHorarios.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Todos los dias seleccionados usaran el horario base.
        </p>
      ) : (
        <div className="grid gap-2">
          {visibleHorarios.map((horario) => {
            const isValid = hasValidTurnoTimeRange(horario.horaInicio, horario.horaFin)
            return (
              <div key={horario.dia} className="grid gap-2 rounded-md border bg-background p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {DIA_LABEL[horario.dia]}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeHorario(horario.dia)}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="time"
                    step="1"
                    value={horario.horaInicio.slice(0, 8)}
                    onChange={(event) =>
                      updateHorario(horario.dia, "horaInicio", event.target.value)
                    }
                  />
                  <Input
                    type="time"
                    step="1"
                    value={horario.horaFin.slice(0, 8)}
                    onChange={(event) =>
                      updateHorario(horario.dia, "horaFin", event.target.value)
                    }
                  />
                </div>
                {!isValid ? (
                  <p className="text-xs text-red-500">
                    La hora fin debe ser mayor a la hora inicio.
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
