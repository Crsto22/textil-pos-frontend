import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const EXCEL_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

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
  return { message: text || "No se pudo exportar el reporte de variantes en Excel" }
}

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) {
      headers.Authorization = authHeader
    }

    let backendRes: Response

    try {
      backendRes = await fetch(`${BACKEND_URL}/api/variante/reporte/excel`, {
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
    const contentType = backendRes.headers.get("content-type") ?? EXCEL_CONTENT_TYPE
    const contentDisposition =
      backendRes.headers.get("content-disposition") ??
      `attachment; filename="productos_disponibles_${Date.now()}.xlsx"`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[VARIANTE/REPORTE/EXCEL]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
