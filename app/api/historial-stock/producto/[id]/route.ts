import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const ALLOWED_QUERY_KEYS = ["idSucursal", "page", "size"] as const

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const { id } = await params
    const queryString = buildForwardQuery(request)
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/historial-stock/producto/${encodeURIComponent(id)}${queryString}`,
        { headers, cache: "no-store" }
      )
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
        payload && typeof payload === "object" && "message" in payload && typeof (payload as Record<string, unknown>).message === "string"
          ? (payload as Record<string, unknown>).message
          : "Error al obtener historial de stock del producto"
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    console.error("[HISTORIAL-STOCK/PRODUCTO]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
