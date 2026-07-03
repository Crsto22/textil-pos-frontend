import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const PDF_CONTENT_TYPE = "application/pdf"

function authHeaders(request: NextRequest): HeadersInit {
  const authHeader = request.headers.get("authorization")
  return authHeader ? { Authorization: authHeader } : {}
}

async function parseErrorResponse(response: Response) {
  const text = await response.text()
  try {
    const parsed = JSON.parse(text) as { message?: string }
    return { message: parsed.message || text || "No se pudo exportar el PDF" }
  } catch {
    return { message: text || "No se pudo exportar el PDF" }
  }
}

export async function GET(request: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  const incoming = new URL(request.url).searchParams
  const outgoing = new URLSearchParams()
  for (const key of ["fechaDesde", "fechaHasta"]) {
    const value = incoming.get(key)
    if (value) outgoing.set(key, value)
  }

  try {
    const query = outgoing.toString()
    const backendRes = await fetch(`${BACKEND_URL}/api/ecommerce/pedidos/reporte/envios/pdf${query ? `?${query}` : ""}`, {
      headers: authHeaders(request),
      cache: "no-store",
    })
    if (!backendRes.ok) {
      return NextResponse.json(await parseErrorResponse(backendRes), { status: backendRes.status })
    }

    return new NextResponse(await backendRes.arrayBuffer(), {
      headers: {
        "Content-Type": backendRes.headers.get("content-type") ?? PDF_CONTENT_TYPE,
        "Content-Disposition":
          backendRes.headers.get("content-disposition") ??
          `attachment; filename="reporte_envios_web_${Date.now()}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar al backend. Verifique que este activo." },
      { status: 503 },
    )
  }
}
