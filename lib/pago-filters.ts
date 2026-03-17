import type { PagoFilters, PagoListadoPeriodoBase } from "@/lib/types/pago"

function padDateSegment(value: number) {
  return String(value).padStart(2, "0")
}

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${padDateSegment(date.getMonth() + 1)}-${padDateSegment(date.getDate())}`
}

function getTodayDateValue() {
  return formatDateValue(new Date())
}

function addDays(baseDate: Date, days: number) {
  const nextDate = new Date(baseDate)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function getStartOfWeek(baseDate: Date) {
  const nextDate = new Date(baseDate)
  const currentDay = nextDate.getDay()
  const diff = currentDay === 0 ? -6 : 1 - currentDay
  nextDate.setDate(nextDate.getDate() + diff)
  return nextDate
}

function getStartOfMonth(baseDate: Date) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
}

export const PAGO_PERIOD_OPTIONS: Array<{
  value: PagoListadoPeriodoBase
  label: string
}> = [
  { value: "HOY", label: "Hoy" },
  { value: "AYER", label: "Ayer" },
  { value: "SEMANA", label: "Semana" },
  { value: "MES", label: "Mes" },
  { value: "FECHA", label: "Fecha especifica" },
]

export function createDefaultPagoFilters(): PagoFilters {
  const today = getTodayDateValue()

  return {
    search: "",
    idUsuario: null,
    idMetodoPago: null,
    idSucursal: null,
    periodo: "HOY",
    usarRangoFechas: false,
    fecha: today,
    fechaDesde: today,
    fechaHasta: today,
  }
}

export function validatePagoFilters(filters: PagoFilters): string | null {
  if (filters.usarRangoFechas) {
    if (!filters.fechaDesde || !filters.fechaHasta) {
      return "Selecciona fecha desde y hasta"
    }

    if (filters.fechaDesde > filters.fechaHasta) {
      return "La fecha 'desde' no puede ser mayor a 'hasta'"
    }

    return null
  }

  if (filters.periodo === "FECHA" && !filters.fecha) {
    return "Selecciona una fecha"
  }

  return null
}

export function resolvePagoDateRange(filters: PagoFilters) {
  if (filters.usarRangoFechas) {
    return {
      desde: filters.fechaDesde,
      hasta: filters.fechaHasta,
    }
  }

  const today = new Date()

  switch (filters.periodo) {
    case "AYER": {
      const yesterday = formatDateValue(addDays(today, -1))
      return { desde: yesterday, hasta: yesterday }
    }
    case "SEMANA":
      return {
        desde: formatDateValue(getStartOfWeek(today)),
        hasta: formatDateValue(today),
      }
    case "MES":
      return {
        desde: formatDateValue(getStartOfMonth(today)),
        hasta: formatDateValue(today),
      }
    case "FECHA":
      return {
        desde: filters.fecha,
        hasta: filters.fecha,
      }
    case "HOY":
    default: {
      const currentDay = formatDateValue(today)
      return { desde: currentDay, hasta: currentDay }
    }
  }
}
