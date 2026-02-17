import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function isValidPage(value: string) {
  if (!/^\d+$/.test(value)) return false
  const page = Number(value)
  return Number.isInteger(page) && page >= 0
}

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      console.error("BACKEND_URL no esta configurado")
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") ?? "").trim()
    const page = (searchParams.get("page") ?? "0").trim()

    if (!q) {
      return NextResponse.json(
        { message: "Debe ingresar nombre de sucursal para buscar" },
        { status: 400 }
      )
    }

    if (!isValidPage(page)) {
      return NextResponse.json(
        { message: "Datos de entrada invalidos" },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get("authorization")

    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/sucursal/buscar?q=${encodeURIComponent(q)}&page=${encodeURIComponent(page)}`,
        { headers }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor. Verifique que el backend este activo." },
        { status: 503 }
      )
    }

    if (!backendRes.ok) {
      const text = await backendRes.text()
      let message = "Error al buscar sucursales"
      try {
        const json = JSON.parse(text)
        message = json.message ?? json.error ?? message
      } catch {
        if (text) message = text
      }
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    const data = await backendRes.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[SUCURSAL/BUSCAR]", error)
    return NextResponse.json(
      { message: "Error interno al procesar la busqueda" },
      { status: 500 }
    )
  }
}
