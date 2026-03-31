import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const DEFAULT_CONTENT_TYPE = "application/xml"

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
  return { message: text || "No se pudo descargar el CDR de SUNAT" }
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

    const formato = request.nextUrl.searchParams.get("formato")
    const backendUrl = new URL(`${BACKEND_URL}/api/venta/${encodeURIComponent(id)}/sunat/cdr`)
    if (formato) {
      backendUrl.searchParams.set("formato", formato)
    }

    let backendRes: Response
    try {
      backendRes = await fetch(backendUrl.toString(), {
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
    const contentType = backendRes.headers.get("content-type") ?? DEFAULT_CONTENT_TYPE
    const fallbackExt = formato === "zip" ? "zip" : "xml"
    const contentDisposition =
      backendRes.headers.get("content-disposition") ??
      `attachment; filename="cdr_venta_${encodeURIComponent(id)}.${fallbackExt}"`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[VENTA/SUNAT/CDR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
