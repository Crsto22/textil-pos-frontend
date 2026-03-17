import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) headers["Authorization"] = authHeader

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/config/sunat/probar-conexion`, {
        method: "POST",
        headers,
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend." },
        { status: 503 }
      )
    }

    const data = await parseJsonSafe(backendRes)
    if (!backendRes.ok) {
      const message =
        data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : "No se pudo validar la configuracion SUNAT"
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[CONFIG/SUNAT/PROBAR-CONEXION]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
