import type { DiaSemana, TurnoHorarioDia } from "@/lib/types/turno"

export const JS_DAY_TO_DIA_SEMANA: Record<number, DiaSemana> = {
  0: "DOMINGO",
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SABADO",
}

export function normalizeTurnoTime(value: string): string {
  if (!value) return ""
  return value.length === 5 ? `${value}:00` : value
}

export function turnoTimeToSeconds(value: string): number {
  const normalized = normalizeTurnoTime(value)
  const [hours = "0", minutes = "0", seconds = "0"] = normalized.split(":")
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
}

export function hasValidTurnoTimeRange(horaInicio: string, horaFin: string): boolean {
  return (
    horaInicio.trim() === "" ||
    horaFin.trim() === "" ||
    turnoTimeToSeconds(horaFin) > turnoTimeToSeconds(horaInicio)
  )
}

export function buildHorariosDiasPayload(horariosDias?: TurnoHorarioDia[]): TurnoHorarioDia[] {
  if (!Array.isArray(horariosDias)) return []

  const seen = new Set<DiaSemana>()
  const normalized: TurnoHorarioDia[] = []

  for (const horario of horariosDias) {
    if (!horario.dia || seen.has(horario.dia)) continue

    const horaInicio = normalizeTurnoTime(horario.horaInicio)
    const horaFin = normalizeTurnoTime(horario.horaFin)
    if (!horaInicio || !horaFin) continue

    normalized.push({
      dia: horario.dia,
      horaInicio,
      horaFin,
    })
    seen.add(horario.dia)
  }

  return normalized
}

export function getTodayTurnoHorario(
  horaInicioTurno?: string | null,
  horaFinTurno?: string | null,
  horariosTurno?: Array<{ dia: string; horaInicio: string; horaFin: string }> | null
): { horaInicio: string | null; horaFin: string | null } {
  const today = JS_DAY_TO_DIA_SEMANA[new Date().getDay()]
  const todayHorario = Array.isArray(horariosTurno)
    ? horariosTurno.find((horario) => horario.dia === today)
    : null

  return {
    horaInicio: todayHorario?.horaInicio ?? horaInicioTurno ?? null,
    horaFin: todayHorario?.horaFin ?? horaFinTurno ?? null,
  }
}
