import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const PDF_CONTENT_TYPE = "application/pdf"

const ALLOWED_QUERY_KEYS = [
  "agrupar",
  "periodo",
  "desde",
  "hasta",
  "idSucursal",
  "idCliente",
  "tipoComprobante",
  "incluirAnuladas",
] as const

function buildForwardQuery(request: NextRequest): string {
  const incomingSearchParams = new URL(request.url).searchParams
  const outgoingSearchParams = new URLSearchParams()

  ALLOWED_QUERY_KEYS.forEach((key) => {
    incomingSearchParams.getAll(key).forEach((value) => {
      if (value !== "") outgoingSearchParams.append(key, value)
    })
  })

  const queryString = outgoingSearchParams.toString()
  return queryString ? `?${queryString}` : ""
}

async function parseErrorResponse(response: Response) {
  const text = await response.text()
  try {
    const parsed = JSON.parse(text) as { message?: string }
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return { message: parsed.message }
    }
  } catch {
    // La respuesta del backend puede ser texto plano.
  }
  return { message: text || "No se pudo descargar el reporte de envios IA" }
}

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {}
    if (authHeader) headers.Authorization = authHeader

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/venta/reporte/envios-ia/pdf${buildForwardQuery(request)}`,
        { method: "GET", headers, cache: "no-store" }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    if (!backendRes.ok) {
      return NextResponse.json(await parseErrorResponse(backendRes), { status: backendRes.status })
    }

    const fileBuffer = await backendRes.arrayBuffer()
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": backendRes.headers.get("content-type") ?? PDF_CONTENT_TYPE,
        "Content-Disposition":
          backendRes.headers.get("content-disposition") ??
          `attachment; filename="reporte_envios_ia_kiments_${Date.now()}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[VENTA/REPORTE/ENVIOS-IA/PDF]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
