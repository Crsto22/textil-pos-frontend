import type { ComponentType } from "react"
import {
  BanknotesIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline"

export const ALL_PAGO_METHOD_FILTER = "ALL"

const PAGO_METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  YAPE: "Yape",
  PLIN: "Plin",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
}

const PAGO_METHOD_LOGOS: Record<string, { src: string; alt: string }> = {
  YAPE: {
    src: "/img/yape-app-seeklogo.png",
    alt: "Logo de Yape",
  },
  PLIN: {
    src: "/img/plin-seeklogo.png",
    alt: "Logo de Plin",
  },
}

function normalizeMethod(method: string) {
  return method.trim().toUpperCase()
}

export function getMetodoPagoLabel(method: string) {
  const normalizedMethod = normalizeMethod(method)
  return PAGO_METHOD_LABELS[normalizedMethod] ?? method
}

export function getMetodoPagoLogo(method: string) {
  const normalizedMethod = normalizeMethod(method)
  return PAGO_METHOD_LOGOS[normalizedMethod] ?? null
}

export function getMetodoPagoIcon(method: string): ComponentType<{ className?: string }> {
  const normalizedMethod = normalizeMethod(method)

  switch (normalizedMethod) {
    case "YAPE":
    case "PLIN":
      return DevicePhoneMobileIcon
    case "TRANSFERENCIA":
      return BuildingLibraryIcon
    case "TARJETA":
      return CreditCardIcon
    default:
      return BanknotesIcon
  }
}

export function getMetodoPagoBadgeClasses(method: string) {
  const normalizedMethod = normalizeMethod(method)

  switch (normalizedMethod) {
    case "EFECTIVO":
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
    case "YAPE":
      return "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300"
    case "PLIN":
      return "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"
    case "TRANSFERENCIA":
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
    case "TARJETA":
      return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
  }
}

export function formatPagoFecha(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed)
}

export function formatPagoMonto(amount: number, currency = "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

interface PagoComprobanteLike {
  serie: string
  correlativo: number
}

export function formatPagoComprobante(pago: PagoComprobanteLike): string {
  const serie = pago.serie?.trim() || "-"
  const correlativo = Number.isFinite(pago.correlativo) ? pago.correlativo : 0
  return `${serie}-${String(correlativo).padStart(6, "0")}`
}
