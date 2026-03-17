import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    const contentType = request.headers.get("content-type") ?? ""

    const headers: HeadersInit = {
      "Content-Type": contentType,
    }
    if (authHeader) headers["Authorization"] = authHeader

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/config/sunat/certificado`, {
        method: "POST",
        headers,
        body: request.body,
        // @ts-expect-error duplex is required by Next/Node runtime when streaming bodies
        duplex: "half",
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend." },
        { status: 503 }
      )
    }

    const text = await backendRes.text()
    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text || "Respuesta invalida del backend" }
    }

    if (!backendRes.ok) {
      const message =
        typeof data.message === "string"
          ? data.message
          : typeof data.error === "string"
            ? data.error
            : "Error al subir el certificado digital"
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[CONFIG/SUNAT/CERTIFICADO]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
