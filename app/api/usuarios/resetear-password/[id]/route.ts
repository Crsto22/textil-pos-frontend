import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      console.error("BACKEND_URL no está configurado")
      return NextResponse.json(
        { message: "Error de configuración del servidor" },
        { status: 500 }
      )
    }

    const { id } = await params

    const authHeader = request.headers.get("authorization")

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let body: string
    try {
      body = JSON.stringify(await request.json())
    } catch {
      return NextResponse.json(
        { message: "Body inválido o vacío" },
        { status: 400 }
      )
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/usuario/resetear-password/${encodeURIComponent(id)}`,
        { method: "PUT", headers, body }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor. Verifique que el backend esté activo." },
        { status: 503 }
      )
    }

    if (!backendRes.ok) {
      const text = await backendRes.text()
      let message = "Error al resetear contraseña"
      try {
        const json = JSON.parse(text)
        message = json.message || json.error || message
      } catch {
        if (text) message = text
      }
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    const text = await backendRes.text()
    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text || "Contraseña reseteada exitosamente" }
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[USUARIOS/RESETEAR-PASSWORD]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
