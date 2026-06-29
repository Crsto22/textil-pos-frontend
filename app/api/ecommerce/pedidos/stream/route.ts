import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export const dynamic = "force-dynamic"

function authHeaders(request: NextRequest): HeadersInit {
  const authHeader = request.headers.get("authorization")
  return authHeader ? { Authorization: authHeader } : {}
}

export async function GET(request: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/ecommerce/pedidos/stream`, {
      headers: {
        ...authHeaders(request),
        Accept: "text/event-stream",
      },
      cache: "no-store",
    })

    if (!backendRes.ok || !backendRes.body) {
      const text = await backendRes.text().catch(() => "")
      return NextResponse.json(
        { message: text || "No se pudo abrir el stream de pedidos" },
        { status: backendRes.status }
      )
    }

    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar al backend. Verifique que este activo." },
      { status: 503 }
    )
  }
}
