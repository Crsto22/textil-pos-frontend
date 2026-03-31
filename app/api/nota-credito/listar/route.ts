import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const ALLOWED_QUERY_KEYS = [
  "q",
  "idVenta",
  "idUsuario",
  "idCliente",
  "codigoMotivo",
  "periodo",
  "fecha",
  "desde",
  "hasta",
  "idSucursal",
  "page",
] as const

function buildForwardQuery(request: NextRequest): string {
  const incomingSearchParams = new URL(request.url).searchParams
  const outgoingSearchParams = new URLSearchParams()

  ALLOWED_QUERY_KEYS.forEach((key) => {
    const value = incomingSearchParams.get(key)
    if (value !== null && value !== "") {
      outgoingSearchParams.set(key, value)
    }
  })

  if (!outgoingSearchParams.has("page")) {
    outgoingSearchParams.set("page", "0")
  }

  const queryString = outgoingSearchParams.toString()
  return queryString ? `?${queryString}` : ""
}

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const queryString = buildForwardQuery(request)
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}

    if (authHeader) {
      headers.Authorization = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/nota-credito/listar${queryString}`, {
        headers,
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    const text = await backendRes.text()
    let data: Record<string, unknown>
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text || "Error desconocido" }
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[NOTA_CREDITO/LISTAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
