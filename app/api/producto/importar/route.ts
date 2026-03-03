import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const ALLOWED_FILE_EXTENSIONS = [".xlsx", ".xls"]

function hasAllowedExtension(fileName: string): boolean {
  const lowerName = fileName.trim().toLowerCase()
  return ALLOWED_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
}

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

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { message: "FormData invalido o vacio" },
        { status: 400 }
      )
    }

    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "El campo file es obligatorio" },
        { status: 400 }
      )
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { message: "El archivo no puede estar vacio" },
        { status: 400 }
      )
    }

    if (!hasAllowedExtension(file.name)) {
      return NextResponse.json(
        { message: "Solo se permiten archivos .xlsx o .xls" },
        { status: 400 }
      )
    }

    const backendFormData = new FormData()
    backendFormData.append("file", file, file.name)

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/producto/importar`, {
        method: "POST",
        headers,
        body: backendFormData,
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

