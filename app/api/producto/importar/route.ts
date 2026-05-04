import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function getPayloadMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim() !== ""
  ) {
    return payload.message
  }

  return fallback
}

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      console.error("BACKEND_URL no esta configurado")
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    let body: string
    try {
      body = JSON.stringify(await request.json())
    } catch {
      return NextResponse.json(
        { message: "Body invalido o vacio" },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/producto/importar`, {
        method: "POST",
        headers,
        body,
      })
    } catch {
      return NextResponse.json(
        {
          message:
            "No se pudo conectar al servidor. Verifique que el backend este activo.",
        },
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
      return NextResponse.json(
        { message: getPayloadMessage(payload, "Error al importar productos") },
        { status: backendRes.status }
      )
    }

    return NextResponse.json(payload, { status: backendRes.status || 201 })
  } catch (error) {
    console.error("[PRODUCTO/IMPORTAR]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

