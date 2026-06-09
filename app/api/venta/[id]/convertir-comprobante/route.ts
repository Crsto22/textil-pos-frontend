import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  const data = asRecord(payload)
  if (!data) return fallbackMessage

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error
  }

  return fallbackMessage
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (authHeader) {
      headers.Authorization = authHeader
    }

    let body: string
    try {
      const payload = await request.json()
      const normalizedPayload = asRecord(payload)
      if (!normalizedPayload) {
        return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
      }

      body = JSON.stringify(normalizedPayload)
    } catch {
      return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/venta/${encodeURIComponent(id)}/convertir-comprobante`,
        {
          method: "POST",
          headers,
          body,
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
        { message: getErrorMessage(payload, "No se pudo convertir la nota de venta") },
        { status: backendRes.status }
      )
    }

    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error) {
    console.error("[VENTA/CONVERTIR_COMPROBANTE]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
