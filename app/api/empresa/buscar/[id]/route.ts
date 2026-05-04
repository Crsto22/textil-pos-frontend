import { NextRequest, NextResponse } from "next/server"
import { normalizeAssetUrlField } from "@/lib/server/public-asset-url"

const BACKEND_URL = process.env.BACKEND_URL

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      console.error("BACKEND_URL no esta configurado")
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/empresa/buscar/${encodeURIComponent(id)}`, {
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
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text || "Respuesta invalida del backend" }
    }

    if (!backendRes.ok) {
      const message =
        typeof payload.message === "string"
          ? payload.message
          : "No se pudo obtener la empresa"

      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(normalizeAssetUrlField(payload, "logoUrl"), { status: 200 })
  } catch (error) {
    console.error("[EMPRESA/BUSCAR]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
