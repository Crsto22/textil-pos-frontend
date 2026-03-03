export function normalizeHex(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim().toUpperCase()
  if (!trimmed) return ""
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`
}

export function toPickerColor(value: string | null | undefined) {
  const normalized = normalizeHex(value)
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : "#000000"
}
