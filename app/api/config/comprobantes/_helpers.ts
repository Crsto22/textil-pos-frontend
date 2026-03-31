import { NextRequest, NextResponse } from "next/server"

export type ComprobanteActivo = "ACTIVO" | "INACTIVO"
const BACKEND_URL = process.env.BACKEND_URL

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

export async function getJsonBody(
  request: NextRequest
): Promise<{ ok: true; body: string } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, body: JSON.stringify(await request.json()) }
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Body invalido o vacio" },
        { status: 400 }
      ),
    }
  }
}

export async function getIdFromParams(
  params: Promise<{ id: string }>
): Promise<string | null> {
  const { id } = await params
  const normalizedId = id?.trim()
  if (!normalizedId) return null
  return normalizedId
}

interface ProxyToBackendOptions {
  request: NextRequest
  backendPath: string
  fallbackMessage: string
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: string
  includeJsonContentType?: boolean
  cache?: RequestCache
  successStatus?: number
}

export async function proxyToBackend({
  request,
  backendPath,
  fallbackMessage,
  method = "GET",
  body,
  includeJsonContentType = false,
  cache,
  successStatus,
}: ProxyToBackendOptions) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "BACKEND_URL no configurado" },
      { status: 500 }
    )
  }

  let backendRes: Response

  try {
    backendRes = await fetch(`${BACKEND_URL}${backendPath}`, {
      method,
      headers: getProxyHeaders(request, { includeJsonContentType }),
      ...(typeof body === "string" ? { body } : {}),
      ...(cache ? { cache } : {}),
    })
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar al backend." },
      { status: 503 }
    )
  }

  const { data, message } = await parseBackendBody(backendRes, fallbackMessage)

  if (!backendRes.ok) {
    return NextResponse.json({ message }, { status: backendRes.status })
  }

  const responseStatus =
    successStatus ?? (backendRes.status === 204 ? 200 : backendRes.status || 200)

  return NextResponse.json(data, { status: responseStatus })
}
