import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const PDF_CONTENT_TYPE = "application/pdf"
const DEFAULT_ERROR_MESSAGE = "No se pudo obtener el comprobante de la cotizacion"

async function parseErrorResponse(response: Response) {
  const text = await response.text()

  try {
    const parsed = JSON.parse(text) as { message?: string; error?: string }
    const message =
      (typeof parsed.message === "string" && parsed.message.trim()) ||
      (typeof parsed.error === "string" && parsed.error.trim()) ||
      DEFAULT_ERROR_MESSAGE

    return { message }
  } catch {
    return { message: text || DEFAULT_ERROR_MESSAGE }
  }
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
      backendRes = await fetch(
        `${BACKEND_URL}/api/cotizacion/${encodeURIComponent(id)}/comprobante/pdf`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      )
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
    const contentType = backendRes.headers.get("content-type") ?? PDF_CONTENT_TYPE
    const contentDisposition =
      backendRes.headers.get("content-disposition")?.replace(/^attachment/i, "inline") ??
      `inline; filename="cotizacion_${encodeURIComponent(id)}.pdf"`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[COTIZACION/COMPROBANTE/PDF]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
