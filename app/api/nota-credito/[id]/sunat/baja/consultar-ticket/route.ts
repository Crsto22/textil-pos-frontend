import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== "object") return fallbackMessage
  if ("message" in payload && typeof payload.message === "string") return payload.message
  if ("error" in payload && typeof payload.error === "string") return payload.error
  return fallbackMessage
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) headers.Authorization = authHeader

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/nota-credito/${encodeURIComponent(id)}/sunat/baja/consultar-ticket`,
        {
          method: "POST",
          headers,
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

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: getErrorMessage(payload, "No se pudo consultar el ticket de baja") },
        { status: backendRes.status }
      )
    }

    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error) {
    console.error("[NOTA_CREDITO/SUNAT/BAJA/CONSULTAR_TICKET]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
