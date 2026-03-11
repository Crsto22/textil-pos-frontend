import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function DELETE(
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
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/cotizacion/eliminar/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    const text = await backendRes.text()
    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text || "Error desconocido" }
    }

    if (!backendRes.ok) {
      const message =
        typeof data.message === "string"
          ? data.message
          : typeof data.error === "string"
            ? data.error
            : "Error al eliminar cotizacion"
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    const message =
      typeof data.message === "string" ? data.message : "Cotizacion eliminada logicamente"

    return NextResponse.json({ message }, { status: backendRes.status })
  } catch (error) {
    console.error("[COTIZACION/ELIMINAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
