import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message
  }

  if ("error" in payload && typeof payload.error === "string") {
    return payload.error
  }

  return fallbackMessage
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ idPago: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const { idPago } = await params
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
      return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/pago/${encodeURIComponent(idPago)}/codigo-operacion`,
        {
          method: "PUT",
          headers,
          body,
        }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor. Verifique que el backend este activo." },
        { status: 503 }
      )
    }

    const text = await backendRes.text()
    if (!text) {
        if (!backendRes.ok) {
            return NextResponse.json({ message: "Error al actualizar pago" }, { status: backendRes.status })
        }
        return NextResponse.json({}, { status: backendRes.status })
    }

    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text || "Respuesta invalida del backend" }
    }

    if (!backendRes.ok) {
      const message = getErrorMessage(payload, "Error al actualizar pago")
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error) {
    console.error("[PAGO/CODIGO_OPERACION]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
