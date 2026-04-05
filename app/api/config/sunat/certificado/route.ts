import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { message: "Debe enviar el certificado digital" },
        { status: 400 }
      )
    }

    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { message: "Debe enviar el certificado digital" },
        { status: 400 }
      )
    }

    const backendFormData = new FormData()
    backendFormData.append("file", file, file.name)

    const certificadoPassword = formData.get("certificadoPassword")
    if (typeof certificadoPassword === "string" && certificadoPassword.trim() !== "") {
      backendFormData.append("certificadoPassword", certificadoPassword.trim())
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/config/sunat/certificado`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: backendFormData,
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
