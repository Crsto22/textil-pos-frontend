import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

async function parseBackendResponse(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { message: text || "Error desconocido" }
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  const { id } = await params
  const authHeader = request.headers.get("authorization")
  const headers: HeadersInit = authHeader ? { Authorization: authHeader } : {}

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/config/ecommerce/portadas/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers,
    })
    return NextResponse.json(await parseBackendResponse(backendRes), { status: backendRes.status })
  } catch {
    return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
  }
}
