const ESTADO_CLASSES: Record<string, string> = {
  EMITIDA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETADA:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ANULADA: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
}

export function getEstadoBadgeClass(estado: string): string {
  const key = estado.trim().toUpperCase()
  return (
    ESTADO_CLASSES[key] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  )
}

export function formatMonto(value: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatFechaHora(isoDate: string): string {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return "-"

  return parsed.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface ComprobanteLike {
  serie: string
  correlativo: number
}

export function formatComprobante(venta: ComprobanteLike): string {
  const serie = venta.serie?.trim() || "-"
  const correlativo = Number.isFinite(venta.correlativo) ? venta.correlativo : 0
  return `${serie}-${String(correlativo).padStart(6, "0")}`
}
