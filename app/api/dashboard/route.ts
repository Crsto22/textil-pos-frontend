import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const ALLOWED_QUERY_KEYS = ["filtro", "desde", "hasta", "idSucursal"] as const

function buildForwardQuery(request: NextRequest): string {
  const incomingSearchParams = new URL(request.url).searchParams
  const outgoingSearchParams = new URLSearchParams()

  ALLOWED_QUERY_KEYS.forEach((key) => {
    const value = incomingSearchParams.get(key)
    if (value !== null && value !== "") {
      outgoingSearchParams.set(key, value)
    }
  })

  const queryString = outgoingSearchParams.toString()
  return queryString ? `?${queryString}` : ""
}

function parseMessage(text: string, fallback: string) {
  try {
    const parsed = JSON.parse(text) as { message?: string }
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return { message: parsed.message }
    }
    return parsed
  } catch {
    return { message: text || fallback }
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers.Authorization = authHeader
    }

    const queryString = buildForwardQuery(request)
    let backendRes: Response

    try {
      backendRes = await fetch(`${BACKEND_URL}/api/dashboard${queryString}`, {
        method: "GET",
        headers,
        cache: "no-store",
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    const text = await backendRes.text()
    const payload = parseMessage(text, "Respuesta invalida del backend")
    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error) {
    console.error("[DASHBOARD]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
