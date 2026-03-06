import { NextRequest } from "next/server"

export type ComprobanteActivo = "ACTIVO" | "INACTIVO"

export function normalizeActivo(value: unknown): ComprobanteActivo | null {
  if (typeof value !== "string") return null
  const normalized = value.trim().toUpperCase()
  if (normalized === "ACTIVO" || normalized === "INACTIVO") {
    return normalized
  }
  return null
}

export function getProxyHeaders(
  request: NextRequest,
  options?: { includeJsonContentType?: boolean }
): HeadersInit {
  const headers: HeadersInit = {}
  if (options?.includeJsonContentType) {
    headers["Content-Type"] = "application/json"
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    headers["Authorization"] = authHeader
  }

  return headers
}

export async function parseBackendBody(
  response: Response,
  fallbackMessage: string
): Promise<{ data: unknown; message: string }> {
  const text = await response.text()

  if (!text) {
    return { data: {}, message: fallbackMessage }
  }

  try {
    const data = JSON.parse(text)
    const message =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : fallbackMessage
    return { data, message }
  } catch {
    return {
      data: { message: text },
      message: text || fallbackMessage,
    }
  }
}
