import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function parsePage(value: string | null): number | null {
  if (value === null || value.trim() === "") return 0

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
}

function parsePositiveInteger(value: string | null): number | null {
  if (value === null || value.trim() === "") return null

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const incomingSearchParams = new URL(request.url).searchParams
    const page = parsePage(incomingSearchParams.get("page"))
    if (page === null) {
      return NextResponse.json({ message: "page debe ser un entero mayor o igual a 0" }, { status: 400 })
    }

    const idSucursalRaw = incomingSearchParams.get("idSucursal")
    const idSucursal = parsePositiveInteger(idSucursalRaw)
    if (idSucursalRaw !== null && idSucursalRaw.trim() !== "" && idSucursal === null) {
      return NextResponse.json({ message: "idSucursal debe ser un entero mayor a 0" }, { status: 400 })
    }

    const backendParams = new URLSearchParams({ page: String(page) })
    if (idSucursal !== null) {
      backendParams.set("idSucursal", String(idSucursal))
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/traslado/listar?${backendParams.toString()}`, {
        headers,
        cache: "no-store",
      })
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
      const message =
        payload && typeof payload === "object" && "message" in payload && typeof (payload as Record<string, unknown>).message === "string"
          ? (payload as Record<string, unknown>).message
          : "Error al listar traslados"
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    console.error("[TRASLADO/LISTAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
