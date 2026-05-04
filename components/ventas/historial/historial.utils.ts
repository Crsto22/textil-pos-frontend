const ESTADO_CLASSES: Record<string, string> = {
  ACTIVA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  EMITIDA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETADA:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  BORRADOR: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ENVIADA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ACEPTADA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  APROBADA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CONVERTIDA: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  VENCIDA: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ANULADA: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  ANULACION_PENDIENTE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  RECHAZADA: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  NC_EMITIDA:"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

const SUNAT_ESTADO_CLASSES: Record<string, string> = {
  NO_APLICA: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PENDIENTE_ENVIO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ENVIANDO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PENDIENTE_CDR: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  ERROR_TRANSITORIO: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  ERROR_DEFINITIVO: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  ACEPTADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  OBSERVADO: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  RECHAZADO: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ERROR: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  NC_EMITIDA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

const SUNAT_ESTADO_LABELS: Record<string, string> = {
  NO_APLICA: "No aplica",
  PENDIENTE_ENVIO: "Pendiente envío",
  ENVIANDO: "Enviando...",
  PENDIENTE_CDR: "Esperando CDR",
  ERROR_TRANSITORIO: "Error (reintentando)",
  ERROR_DEFINITIVO: "Error definitivo",
  ACEPTADO: "Aceptado",
  OBSERVADO: "Observado",
  RECHAZADO: "Rechazado",
  PENDIENTE: "Pendiente",
  ERROR: "Error",
  NC_EMITIDA: "NC Emitida",
}

export function getEstadoBadgeClass(estado: string): string {
  const key = estado.trim().toUpperCase()
  return (
    ESTADO_CLASSES[key] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  )
}

export function getSunatBadgeClass(estado: string | null | undefined): string {
  const key = normalizeSunatEstado(estado)
  return (
    SUNAT_ESTADO_CLASSES[key] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  )
}

export function getSunatEstadoLabel(estado: string | null | undefined): string {
  if (!estado) return "N/A"
  const key = normalizeSunatEstado(estado)
  return SUNAT_ESTADO_LABELS[key] ?? estado
}

export function normalizeSunatEstado(estado: string | null | undefined): string {
  return (estado ?? "").trim().toUpperCase()
}

export function isSunatNotApplicable(estado: string | null | undefined): boolean {
  return normalizeSunatEstado(estado) === "NO_APLICA"
}

export function formatMonto(value: number, currency = "PEN"): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
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
