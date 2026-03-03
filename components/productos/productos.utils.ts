export function formatFechaCreacion(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

const PEN_CURRENCY_FORMATTER = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMonedaPen(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "Sin precio"
  return PEN_CURRENCY_FORMATTER.format(value)
}

export function formatRangoPrecioPen(
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined
): string {
  const hasMin = typeof minPrice === "number" && !Number.isNaN(minPrice)
  const hasMax = typeof maxPrice === "number" && !Number.isNaN(maxPrice)

  if (hasMin && hasMax) {
    if (Math.abs((minPrice ?? 0) - (maxPrice ?? 0)) < 0.0001) {
      return formatMonedaPen(minPrice)
    }
    return `${formatMonedaPen(minPrice)} - ${formatMonedaPen(maxPrice)}`
  }
  if (hasMin) return `Desde ${formatMonedaPen(minPrice)}`
  if (hasMax) return `Hasta ${formatMonedaPen(maxPrice)}`
  return "Sin precio"
}
