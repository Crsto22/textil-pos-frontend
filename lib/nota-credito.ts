import type { NotaCreditoMotivoCodigo } from "@/lib/types/nota-credito"

const NOTA_CREDITO_MOTIVO_LABELS: Record<string, string> = {
  "02": "Anulacion de la operacion",
  "03": "Anulacion por error en el RUC",
  "06": "Devolucion total",
  "07": "Devolucion parcial",
}

export const NOTA_CREDITO_MOTIVO_OPTIONS: Array<{
  value: NotaCreditoMotivoCodigo
  label: string
}> = Object.entries(NOTA_CREDITO_MOTIVO_LABELS).map(([value, label]) => ({
  value: value as NotaCreditoMotivoCodigo,
  label,
}))

export function getNotaCreditoMotivoLabel(
  codigoMotivo: string | null | undefined,
  fallbackDescription?: string | null
): string {
  const normalizedCode = codigoMotivo?.trim() ?? ""
  if (normalizedCode && NOTA_CREDITO_MOTIVO_LABELS[normalizedCode]) {
    return NOTA_CREDITO_MOTIVO_LABELS[normalizedCode]
  }

  const normalizedDescription = fallbackDescription?.trim() ?? ""
  if (normalizedDescription) {
    return normalizedDescription
  }

  if (normalizedCode) {
    return `Motivo ${normalizedCode}`
  }

  return "Sin motivo"
}
