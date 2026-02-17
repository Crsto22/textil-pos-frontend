import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      console.error("BACKEND_URL no esta configurado")
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/producto/eliminar/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers,
        }
      )
    } catch {
      return NextResponse.json(
        {
          message:
            "No se pudo conectar al servidor. Verifique que el backend este activo.",
        },
        { status: 503 }
      )
    }

    if (!backendRes.ok) {
      const text = await backendRes.text()
      let message = "Error al eliminar producto"
      try {
        const json = JSON.parse(text)
        message = json.message ?? json.error ?? message
      } catch {
        if (text) message = text
      }
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    const text = await backendRes.text()
    let message = "Producto eliminado correctamente"
    try {
      const json = JSON.parse(text)
      message = json.message ?? message
    } catch {
      if (text) message = text
    }

    return NextResponse.json({ message }, { status: 200 })
  } catch (error) {
    console.error("[PRODUCTO/ELIMINAR]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
