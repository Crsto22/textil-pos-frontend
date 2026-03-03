import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const DEFAULT_SUCCESS_MESSAGE = "Producto eliminado correctamente"
const DEFAULT_ERROR_MESSAGE = "Error al eliminar producto"
const DEFAULT_FORBIDDEN_MESSAGE =
  "El usuario autenticado no tiene permisos para gestionar productos"
const DEFAULT_UNAUTHORIZED_MESSAGE = "No autenticado"

function getMessageFromBackendPayload(rawText: string, fallback: string): string {
  if (!rawText) return fallback

  try {
    const json = JSON.parse(rawText)
    if (
      json &&
      typeof json === "object" &&
      "message" in json &&
      typeof json.message === "string" &&
      json.message.trim().length > 0
    ) {
      return json.message
    }

    if (
      json &&
      typeof json === "object" &&
      "error" in json &&
      typeof json.error === "string" &&
      json.error.trim().length > 0
    ) {
      return json.error
    }
  } catch {
    if (rawText.trim().length > 0) return rawText
  }

  return fallback
}

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
      const rawText = await backendRes.text()
      const fallbackMessage =
        backendRes.status === 400
          ? "No se puede eliminar el producto porque esta asociado a variantes. Te sugiero desactivarlo."
          : backendRes.status === 403
            ? authHeader
              ? DEFAULT_FORBIDDEN_MESSAGE
              : DEFAULT_UNAUTHORIZED_MESSAGE
            : backendRes.status === 404
              ? `Producto con ID ${id} no encontrado`
              : DEFAULT_ERROR_MESSAGE

      const message = getMessageFromBackendPayload(rawText, fallbackMessage)
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    const rawText = await backendRes.text()
    const message = getMessageFromBackendPayload(rawText, DEFAULT_SUCCESS_MESSAGE)

    return NextResponse.json({ message }, { status: 200 })
  } catch (error) {
    console.error("[PRODUCTO/ELIMINAR]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
