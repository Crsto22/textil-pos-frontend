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

export async function GET(request: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/config/ecommerce/portadas`, {
      headers: authHeaders(request),
      cache: "no-store",
    })
    return NextResponse.json(await parseBackendResponse(backendRes), { status: backendRes.status })
  } catch {
    return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  const incoming = await request.formData().catch(() => null)
  const desktop = incoming?.get("desktop")
  const mobile = incoming?.get("mobile")
  if (!(desktop instanceof File) || !(mobile instanceof File)) {
    return NextResponse.json({ message: "Debe enviar imagen desktop y mobile" }, { status: 400 })
  }

  const formData = new FormData()
  formData.append("desktop", desktop, desktop.name)
  formData.append("mobile", mobile, mobile.name)

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/config/ecommerce/portadas`, {
      method: "POST",
      headers: authHeaders(request),
      body: formData,
    })
    return NextResponse.json(await parseBackendResponse(backendRes), { status: backendRes.status })
  } catch {
    return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
  }
}
