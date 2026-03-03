import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function parseOrden(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) return null
  return parsed
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase()
  if (normalized === "true") return true
  if (normalized === "false") return false
  return null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ idColorImagen: string }> }
) {
  try {
    if (!BACKEND_URL) {
      console.error("BACKEND_URL no esta configurado")
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const { idColorImagen } = await params
    const parsedIdColorImagen = parsePositiveInt(idColorImagen)
    if (parsedIdColorImagen === null) {
      return NextResponse.json(
        { message: "El idColorImagen debe ser valido" },
        { status: 400 }
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

    const ordenValue = String(formData.get("orden") ?? "").trim()
    const esPrincipalValue = String(formData.get("esPrincipal") ?? "").trim()

    const backendFormData = new FormData()
    backendFormData.append("file", file, file.name)

    if (ordenValue !== "") {
      const parsedOrden = parseOrden(ordenValue)
      if (parsedOrden === null) {
        return NextResponse.json(
          { message: "El orden de imagen debe estar entre 1 y 5" },
          { status: 400 }
        )
      }
      backendFormData.append("orden", String(parsedOrden))
    }

    if (esPrincipalValue !== "") {
      const parsedEsPrincipal = parseBoolean(esPrincipalValue)
      if (parsedEsPrincipal === null) {
        return NextResponse.json(
          { message: "El campo esPrincipal debe ser true o false" },
          { status: 400 }
        )
      }
      backendFormData.append("esPrincipal", String(parsedEsPrincipal))
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/producto/imagenes/${parsedIdColorImagen}`,
        {
          method: "PUT",
          headers,
          body: backendFormData,
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

    const text = await backendRes.text()
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text || "Respuesta invalida del backend" }
    }

    if (!backendRes.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Error al actualizar imagen del producto"

      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    console.error("[PRODUCTO/IMAGENES/ACTUALIZAR]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
