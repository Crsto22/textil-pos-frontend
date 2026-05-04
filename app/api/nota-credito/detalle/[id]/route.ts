import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) headers.Authorization = authHeader

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/nota-credito/detalle/${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    const text = await backendRes.text()
    const payload = text
      ? (() => {
          try {
            return JSON.parse(text)
          } catch {
            return { message: text || "Respuesta invalida del backend" }
          }
        })()
      : {}

    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error) {
    console.error("[NOTA_CREDITO/DETALLE]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
