import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const ALLOWED_QUERY_KEYS = ["page", "size", "estado", "q", "fechaDesde", "fechaHasta"] as const

function authHeaders(request: NextRequest): HeadersInit {
  const authHeader = request.headers.get("authorization")
  return authHeader ? { Authorization: authHeader } : {}
}

async function parseBackendResponse(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { message: text || "Error desconocido" }
  }
}

export async function GET(request: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  const incoming = new URL(request.url).searchParams
  const outgoing = new URLSearchParams()
  ALLOWED_QUERY_KEYS.forEach((key) => {
    const value = incoming.get(key)
    if (value) outgoing.set(key, value)
  })
  if (!outgoing.has("page")) outgoing.set("page", "0")
  if (!outgoing.has("size")) outgoing.set("size", "20")

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/ecommerce/pedidos?${outgoing.toString()}`, {
      headers: authHeaders(request),
      cache: "no-store",
    })
    return NextResponse.json(await parseBackendResponse(backendRes), { status: backendRes.status })
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar al backend. Verifique que este activo." },
      { status: 503 }
    )
  }
}
