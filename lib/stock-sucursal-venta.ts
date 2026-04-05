import type { StockSucursalVenta } from "@/lib/types/producto"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function pickNumber(
  source: Record<string, unknown> | null,
  keys: string[],
  fallback = 0
) {
  if (!source) return fallback

  for (const key of keys) {
    const parsed = Number(source[key])
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function pickString(
  source: Record<string, unknown> | null,
  keys: string[],
  fallback = ""
) {
  if (!source) return fallback

  for (const key of keys) {
    if (typeof source[key] === "string") {
      const value = (source[key] as string).trim()
      if (value) return value
    }
  }

  return fallback
}

export function parseStockSucursalVenta(value: unknown): StockSucursalVenta | null {
  const payload = asRecord(value)
  if (!payload) return null

  const idSucursal = pickNumber(payload, ["idSucursal"])
  if (idSucursal <= 0) return null

  return {
    idSucursal,
    nombreSucursal: pickString(payload, ["nombreSucursal"], `Sucursal #${idSucursal}`),
    stock: pickNumber(payload, ["stock"]),
  }
}

export function parseStocksSucursalesVenta(value: unknown): StockSucursalVenta[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => parseStockSucursalVenta(item))
    .filter((item): item is StockSucursalVenta => item !== null)
}
