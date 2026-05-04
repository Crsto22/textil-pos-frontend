import "server-only"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getBackendPublicBaseUrl() {
  const candidate =
    process.env.BACKEND_PUBLIC_URL?.trim() || process.env.BACKEND_URL?.trim() || ""

  return candidate.length > 0 ? candidate : null
}

export function resolvePublicAssetUrl(value: unknown): string | null {
  if (typeof value !== "string") return null

  const normalizedValue = value.trim()
  if (!normalizedValue) return null

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue
  }

  const backendPublicBaseUrl = getBackendPublicBaseUrl()
  if (!backendPublicBaseUrl) {
    return normalizedValue
  }

  try {
    const relativePath = normalizedValue.startsWith("/")
      ? normalizedValue
      : `/${normalizedValue}`

    return new URL(relativePath, backendPublicBaseUrl).toString()
  } catch {
    return normalizedValue
  }
}

export function normalizeAssetUrlField<T>(
  payload: T,
  fieldName: string
): T {
  if (Array.isArray(payload)) {
    return payload.map((item) =>
      normalizeAssetUrlField(item, fieldName)
    ) as T
  }

  if (!isRecord(payload) || !(fieldName in payload)) {
    return payload
  }

  return {
    ...payload,
    [fieldName]: resolvePublicAssetUrl(payload[fieldName]),
  } as T
}

export function normalizeAssetUrlFieldsDeep<T>(
  payload: T,
  fieldNames: string[]
): T {
  if (Array.isArray(payload)) {
    return payload.map((item) =>
      normalizeAssetUrlFieldsDeep(item, fieldNames)
    ) as T
  }

  if (!isRecord(payload)) {
    return payload
  }

  const normalizedEntries = Object.entries(payload).map(([key, value]) => {
    if (fieldNames.includes(key)) {
      return [key, resolvePublicAssetUrl(value)]
    }

    return [key, normalizeAssetUrlFieldsDeep(value, fieldNames)]
  })

  return Object.fromEntries(normalizedEntries) as T
}
