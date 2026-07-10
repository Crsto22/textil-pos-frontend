import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const ALLOWED_QUERY_KEYS = ["page", "vigencia"] as const

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

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/ecommerce/promociones-combo?${outgoing.toString()}`, {
      headers: authHeaders(request),
      cache: "no-store",
    })
    return NextResponse.json(await parseBackendResponse(backendRes), { status: backendRes.status })
  } catch {
    return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  const body = await request.json().catch(() => null)

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/ecommerce/promociones-combo`, {
      method: "POST",
      headers: { ...authHeaders(request), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return NextResponse.json(await parseBackendResponse(backendRes), { status: backendRes.status })
  } catch {
    return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
  }
}
