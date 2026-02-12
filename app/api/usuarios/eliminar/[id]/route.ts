import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function DELETE(
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

    // Reenviar Authorization del cliente al backend
    const authHeader = request.headers.get("authorization")

    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/usuario/eliminar/${encodeURIComponent(id)}`,
        { method: "DELETE", headers }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor. Verifique que el backend esté activo." },
        { status: 503 }
      )
    }

    if (!backendRes.ok) {
      const text = await backendRes.text()
      let message = "Error al eliminar usuario"
      try {
        const json = JSON.parse(text)
        message = json.message || json.error || message
      } catch {
        // Texto plano (ej: "Usuario con ID X no encontrado o ya eliminado")
        if (text) message = text
      }
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    // Éxito: backend devuelve texto plano "Usuario eliminado logicamente"
    const text = await backendRes.text()
    let message = "Usuario eliminado logicamente"
    try {
      const json = JSON.parse(text)
      message = json.message || message
    } catch {
      if (text) message = text
    }
    return NextResponse.json({ message }, { status: 200 })
  } catch (error) {
    console.error("[USUARIOS/ELIMINAR]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
