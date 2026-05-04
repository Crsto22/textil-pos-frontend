"use client"

const SKU_SEGMENT_LENGTH = 3
const SKU_SEQUENCE_LENGTH = 3

export interface AutoSkuVariantDescriptor {
  key: string
  colorName: string
  tallaName: string
  currentSku?: string
  preserveExisting?: boolean
}

export function normalizeSkuCharacters(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

function buildSkuFixedSegment(value: string, fallback: string): string {
  const token = normalizeSkuCharacters(value).slice(0, SKU_SEGMENT_LENGTH)
  return token !== "" ? token : fallback
}

function buildSkuTallaSegment(value: string): string {
  const token = normalizeSkuCharacters(value)
  return token !== "" ? token : "TAL"
}

export function formatSkuSequence(sequence: number): string {
  const safeSequence = Number.isFinite(sequence) ? Math.max(1, Math.trunc(sequence)) : 1
  return String(safeSequence).padStart(SKU_SEQUENCE_LENGTH, "0")
}

export function extractSkuSequence(value: string): number | null {
  const match = value.trim().toUpperCase().match(/-(\d{3})$/)
  if (!match) return null

  const parsed = Number(match[1])
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function collectSkuStrings(value: unknown): string[] {
  const collected = new Set<string>()

  const visit = (current: unknown) => {
    if (Array.isArray(current)) {
      current.forEach(visit)
      return
    }

    if (!current || typeof current !== "object") return

    Object.entries(current).forEach(([key, nestedValue]) => {
      if (key === "sku" && typeof nestedValue === "string" && nestedValue.trim() !== "") {
        collected.add(nestedValue.trim())
      }

      visit(nestedValue)
    })
  }

  visit(value)

  return Array.from(collected)
}

export function getNextSkuSequenceFromPayload(payload: unknown): number {
  return (
    collectSkuStrings(payload).reduce((maxSequence, sku) => {
      const sequence = extractSkuSequence(sku)
      if (sequence === null) return maxSequence
      return Math.max(maxSequence, sequence)
    }, 0) + 1
  )
}

export function buildAutoSkuBase(
  productName: string,
  colorName: string,
  tallaName: string
): string {
  return [
    buildSkuFixedSegment(productName, "PRO"),
    buildSkuFixedSegment(colorName, "COL"),
    buildSkuTallaSegment(tallaName),
  ].join("-")
}

export function buildAutoSkuByVariantKey(
  productName: string,
  variants: AutoSkuVariantDescriptor[],
  startingSequence: number
): Record<string, string> {
  const skuByVariantKey: Record<string, string> = {}
  let nextSequence = Math.max(1, Math.trunc(startingSequence))

  variants.forEach((variant) => {
    const currentSku = variant.currentSku?.trim() ?? ""
    if (variant.preserveExisting && currentSku !== "") return

    const baseSku = buildAutoSkuBase(productName, variant.colorName, variant.tallaName)
    skuByVariantKey[variant.key] = `${baseSku}-${formatSkuSequence(nextSequence)}`
    nextSequence += 1
  })

  return skuByVariantKey
}
