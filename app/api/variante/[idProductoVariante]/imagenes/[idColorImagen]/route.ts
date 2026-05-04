import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    if ("message" in payload && typeof (payload as Record<string, unknown>).message === "string") {
      return (payload as Record<string, unknown>).message as string
    }
    if ("error" in payload && typeof (payload as Record<string, unknown>).error === "string") {
      return (payload as Record<string, unknown>).error as string
    }
  }
  return fallback
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ idProductoVariante: string; idColorImagen: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const { idProductoVariante, idColorImagen } = await params
    const parsedVarianteId = parsePositiveInt(idProductoVariante)
    const parsedImagenId = parsePositiveInt(idColorImagen)

    if (parsedVarianteId === null) {
      return NextResponse.json({ message: "idProductoVariante invalido" }, { status: 400 })
    }
    if (parsedImagenId === null) {
      return NextResponse.json({ message: "idColorImagen invalido" }, { status: 400 })
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) headers["Authorization"] = authHeader

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/variante/${encodeURIComponent(parsedVarianteId)}/imagenes/${encodeURIComponent(parsedImagenId)}`,
        { method: "DELETE", headers }
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
      const message = getErrorMessage(payload, "Error al eliminar imagen de la variante")
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error) {
    console.error("[VARIANTE/IMAGENES/DELETE]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
