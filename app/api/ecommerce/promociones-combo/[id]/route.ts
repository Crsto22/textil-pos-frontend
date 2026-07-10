import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function authHeaders(request: NextRequest): HeadersInit {
  const authHeader = request.headers.get("authorization")
  return authHeader ? { Authorization: authHeader } : {}
}

async function parseBackendResponse(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { message: text || "Error desconocido" }
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/ecommerce/promociones-combo/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { ...authHeaders(request), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return NextResponse.json(await parseBackendResponse(backendRes), { status: backendRes.status })
  } catch {
    return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
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

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/ecommerce/promociones-combo/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(request),
    })
    return NextResponse.json(await parseBackendResponse(backendRes), { status: backendRes.status })
  } catch {
    return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
  }
}
