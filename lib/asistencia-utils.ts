export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-"
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
  const date = new Date(hasZone ? value : `${value}-05:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Lima",
  }).format(date)
}

export function formatMinutes(value: number): string {
  const minutes = Math.max(0, Number(value) || 0)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours} h ${rest} min` : `${rest} min`
}

export function formatDurationSeconds(value: number): string {
  const seconds = Math.max(0, Math.floor(Number(value) || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  const parts = []
  if (hours > 0) parts.push(`${hours} h`)
  if (minutes > 0 || hours > 0) parts.push(`${minutes} min`)
  if (rest > 0 || parts.length === 0) parts.push(`${rest} s`)
  return parts.join(" ")
}

export function todayInLima(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export type AsistenciaPeriod = "SEMANA_ACTUAL" | "SEMANA_ANTERIOR" | "QUINCENA_ACTUAL" | "QUINCENA_ANTERIOR" | "MES_ACTUAL" | "MES_ANTERIOR" | "RANGO"

function inputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function localDate(value: string): Date {
  return new Date(`${value}T12:00:00`)
}

function monthRange(date: Date, offset: number) {
  return {
    desde: inputDate(new Date(date.getFullYear(), date.getMonth() + offset, 1, 12)),
    hasta: inputDate(new Date(date.getFullYear(), date.getMonth() + offset + 1, 0, 12)),
  }
}

export function asistenciaPeriodRange(period: Exclude<AsistenciaPeriod, "RANGO">) {
  const today = localDate(todayInLima())
  const day = today.getDate()
  if (period === "SEMANA_ACTUAL" || period === "SEMANA_ANTERIOR") {
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - (period === "SEMANA_ANTERIOR" ? 7 : 0))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { desde: inputDate(monday), hasta: inputDate(sunday) }
  }
  if (period === "MES_ACTUAL") return monthRange(today, 0)
  if (period === "MES_ANTERIOR") return monthRange(today, -1)
  if (period === "QUINCENA_ACTUAL") {
    return day <= 15
      ? { desde: inputDate(new Date(today.getFullYear(), today.getMonth(), 1, 12)), hasta: inputDate(new Date(today.getFullYear(), today.getMonth(), 15, 12)) }
      : { desde: inputDate(new Date(today.getFullYear(), today.getMonth(), 16, 12)), hasta: monthRange(today, 0).hasta }
  }
  return day <= 15
    ? { desde: inputDate(new Date(today.getFullYear(), today.getMonth() - 1, 16, 12)), hasta: monthRange(today, -1).hasta }
    : { desde: inputDate(new Date(today.getFullYear(), today.getMonth(), 1, 12)), hasta: inputDate(new Date(today.getFullYear(), today.getMonth(), 15, 12)) }
}
