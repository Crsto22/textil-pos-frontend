import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const ALLOWED_QUERY_KEYS = ["page"] as const

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function pickNullableString(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) return null

  for (const key of keys) {
    if (typeof source[key] === "string") {
      const value = source[key].trim()
      return value === "" ? null : value
    }
  }

  return null
}

function normalizeOfferItem(value: unknown) {
  const item = asRecord(value)
  if (!item) return value

  return {
    ...item,
    imageUrl: pickNullableString(item, ["imageUrl", "imagenUrl"]),
  }
}

function normalizeOfferPagePayload(value: unknown) {
  const payload = asRecord(value)
  if (!payload || !Array.isArray(payload.content)) {
    return value
  }

  return {
    ...payload,
    content: payload.content.map((item) => normalizeOfferItem(item)),
  }
}

function buildForwardQuery(request: NextRequest): string {
  const incomingSearchParams = new URL(request.url).searchParams
  const outgoingSearchParams = new URLSearchParams()

  ALLOWED_QUERY_KEYS.forEach((key) => {
    const value = incomingSearchParams.get(key)?.trim()
    if (value) {
      outgoingSearchParams.set(key, value)
    }
  })

  if (!outgoingSearchParams.has("page")) {
    outgoingSearchParams.set("page", "0")
  }

  const queryString = outgoingSearchParams.toString()
  return queryString ? `?${queryString}` : ""
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message
  }

  if ("error" in payload && typeof payload.error === "string") {
    return payload.error
  }

  return fallbackMessage
}

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const queryString = buildForwardQuery(request)
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/variante/ofertas${queryString}`, {
        headers,
        cache: "no-store",
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor. Verifique que el backend este activo." },
        { status: 503 }
      )
    }

    const text = await backendRes.text()
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text || "Respuesta invalida del backend" }
    }

    if (!backendRes.ok) {
      const message = getErrorMessage(payload, "Error al listar ofertas de variantes")
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(normalizeOfferPagePayload(payload), {
      status: backendRes.status,
    })
  } catch (error) {
    console.error("[VARIANTE/OFERTAS]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
