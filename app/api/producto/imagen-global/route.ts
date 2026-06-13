import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
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

    const productoIdValue = String(formData.get("productoId") ?? "")
    const fileEntry = formData.get("file")

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { message: "Debe enviar una imagen global valida" },
        { status: 400 }
      )
    }

    const backendFormData = new FormData()
    backendFormData.append("file", fileEntry, fileEntry.name)

    if (productoIdValue.trim() !== "") {
      const parsedProductoId = parsePositiveInt(productoIdValue)
      if (parsedProductoId === null) {
        return NextResponse.json(
          { message: "El campo productoId debe ser valido" },
          { status: 400 }
        )
      }
      backendFormData.append("productoId", String(parsedProductoId))
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/producto/imagen-global`, {
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

    if (!backendRes.ok) {
      let message = "Error al subir imagen global del producto"
      try {
        const json = JSON.parse(text)
        message = json.message ?? json.error ?? message
      } catch {
        if (text) message = text
      }

      return NextResponse.json({ message }, { status: backendRes.status })
    }

    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text || "Imagen global subida exitosamente" }
    }

    return NextResponse.json(data, { status: backendRes.status || 201 })
  } catch (error) {
    console.error("[PRODUCTO/IMAGEN-GLOBAL]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
