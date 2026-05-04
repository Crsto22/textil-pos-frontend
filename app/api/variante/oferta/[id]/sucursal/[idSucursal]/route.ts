import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; idSucursal: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const { id, idSucursal } = await params
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let body: string
    try {
      body = JSON.stringify(await request.json())
    } catch {
      return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/variante/oferta/${encodeURIComponent(id)}/sucursal/${encodeURIComponent(idSucursal)}`,
        {
          method: "PATCH",
          headers,
          body,
        }
      )
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
          : "Error al actualizar oferta de sucursal"

      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error) {
    console.error("[VARIANTE/OFERTA/SUCURSAL]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
