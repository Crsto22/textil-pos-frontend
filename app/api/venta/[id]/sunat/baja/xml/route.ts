import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const XML_CONTENT_TYPE = "application/xml"

async function parseErrorResponse(response: Response) {
  const text = await response.text()
  try {
    const parsed = JSON.parse(text) as { message?: string }
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return { message: parsed.message }
    }
  } catch {
    // ignore JSON parse errors
  }
  return { message: text || "No se pudo descargar el XML de baja de SUNAT" }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers.Authorization = authHeader
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/venta/${encodeURIComponent(id)}/sunat/baja/xml`, {
        method: "GET",
        headers,
        cache: "no-store",
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    if (!backendRes.ok) {
      const payload = await parseErrorResponse(backendRes)
      return NextResponse.json(payload, { status: backendRes.status })
    }

    const fileBuffer = await backendRes.arrayBuffer()
    const contentType = backendRes.headers.get("content-type") ?? XML_CONTENT_TYPE
    const contentDisposition =
      backendRes.headers.get("content-disposition") ??
      `attachment; filename="baja_venta_${encodeURIComponent(id)}.xml"`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[VENTA/SUNAT/BAJA/XML]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
