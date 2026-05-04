import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== "object") return fallbackMessage
  if ("message" in payload && typeof payload.message === "string") return payload.message
  if ("error" in payload && typeof payload.error === "string") return payload.error
  return fallbackMessage
}

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const incoming = new URL(request.url).searchParams
    const idSucursal = incoming.get("idSucursal")?.trim()

    if (!idSucursal) {
      return NextResponse.json(
        { message: "El parametro idSucursal es obligatorio" },
        { status: 400 }
      )
    }

    const outgoing = new URLSearchParams()
    outgoing.set("idSucursal", idSucursal)
    outgoing.set("page", incoming.get("page")?.trim() || "0")

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) headers["Authorization"] = authHeader

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/variante/ofertas/sucursal?${outgoing.toString()}`,
        { headers, cache: "no-store" }
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
      const message = getErrorMessage(payload, "Error al listar ofertas de sucursal")
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error) {
    console.error("[VARIANTE/OFERTAS/SUCURSAL]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
