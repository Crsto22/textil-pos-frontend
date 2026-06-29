import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

async function parseResponseBody(res: Response): Promise<unknown> {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { message: text || "Error" }
  }
}

function getAuthHeaders(request: NextRequest, includeJson = false): HeadersInit {
  const headers: HeadersInit = includeJson ? { "Content-Type": "application/json" } : {}
  const authHeader = request.headers.get("authorization")
  if (authHeader) headers["Authorization"] = authHeader
  return headers
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ idSucursal: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const { idSucursal } = await params
    if (!idSucursal?.trim()) {
      return NextResponse.json({ message: "Ingrese idSucursal" }, { status: 400 })
    }

    let res: Response
    try {
      res = await fetch(
        `${BACKEND_URL}/api/config/sucursales/${encodeURIComponent(idSucursal)}/metodos-pago`,
        {
          headers: getAuthHeaders(request),
          cache: "no-store",
        }
      )
    } catch {
      return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
    }

    const data = await parseResponseBody(res)
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("[SUCURSAL/METODOS-PAGO GET]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ idSucursal: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const { idSucursal } = await params
    if (!idSucursal?.trim()) {
      return NextResponse.json({ message: "Ingrese idSucursal" }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
    }

    let res: Response
    try {
      res = await fetch(
        `${BACKEND_URL}/api/config/sucursales/${encodeURIComponent(idSucursal)}/metodos-pago`,
        {
          method: "PUT",
          headers: getAuthHeaders(request, true),
          body: JSON.stringify(body),
        }
      )
    } catch {
      return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
    }

    const data = await parseResponseBody(res)
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("[SUCURSAL/METODOS-PAGO PUT]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
