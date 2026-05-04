import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const MAX_FILES = 5

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    if ("message" in payload && typeof (payload as Record<string, unknown>).message === "string") {
      return (payload as Record<string, unknown>).message as string
    }
    if ("error" in payload && typeof (payload as Record<string, unknown>).error === "string") {
      return (payload as Record<string, unknown>).error as string
    }
  }
  return fallback
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ idProductoVariante: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const { idProductoVariante } = await params
    const parsedId = parsePositiveInt(idProductoVariante)
    if (parsedId === null) {
      return NextResponse.json(
        { message: "idProductoVariante invalido" },
        { status: 400 }
      )
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ message: "FormData invalido o vacio" }, { status: 400 })
    }

    const fileEntries = formData.getAll("files")

    if (fileEntries.length === 0) {
      return NextResponse.json(
        { message: "Debe enviar al menos una imagen" },
        { status: 400 }
      )
    }

    if (fileEntries.length > MAX_FILES) {
      return NextResponse.json(
        { message: `Maximo ${MAX_FILES} imagenes por variante` },
        { status: 400 }
      )
    }

    const backendFormData = new FormData()
    for (const entry of fileEntries) {
      if (!(entry instanceof File)) {
        return NextResponse.json(
          { message: "El campo files debe contener solo archivos" },
          { status: 400 }
        )
      }
      backendFormData.append("files", entry, entry.name)
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) headers["Authorization"] = authHeader

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/variante/${encodeURIComponent(parsedId)}/imagenes`,
        { method: "POST", headers, body: backendFormData }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor. Verifique que el backend este activo." },
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
      const message = getErrorMessage(payload, "Error al subir imagenes de la variante")
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error) {
    console.error("[VARIANTE/IMAGENES/POST]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
