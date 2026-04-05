import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const ALLOWED_QUERY_KEYS = ["idSucursal"] as const

function buildForwardQuery(request: NextRequest): string {
  const incomingSearchParams = new URL(request.url).searchParams
  const outgoingSearchParams = new URLSearchParams()

  ALLOWED_QUERY_KEYS.forEach((key) => {
    const value = incomingSearchParams.get(key)?.trim()
    if (value) {
      outgoingSearchParams.set(key, value)
    }
  })

  const queryString = outgoingSearchParams.toString()
  return queryString ? `?${queryString}` : ""
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
      backendRes = await fetch(`${BACKEND_URL}/api/variante/listar${queryString}`, {
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
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Error al listar variantes"
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    console.error("[VARIANTE/LISTAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
