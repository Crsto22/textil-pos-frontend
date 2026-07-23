import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function proxyAsistencia(
  request: NextRequest,
  path: string,
  allowedQuery: readonly string[] = []
) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  const incoming = new URL(request.url).searchParams
  const outgoing = new URLSearchParams()
  for (const key of allowedQuery) {
    const value = incoming.get(key)
    if (value !== null && value !== "") outgoing.set(key, value)
  }

  const headers: HeadersInit = {}
  const authorization = request.headers.get("authorization")
  if (authorization) headers.Authorization = authorization

  const hasBody = request.method === "POST" || request.method === "PUT" || request.method === "PATCH"
  if (hasBody) headers["Content-Type"] = "application/json"

  try {
    const response = await fetch(
      `${BACKEND_URL}${path}${outgoing.size ? `?${outgoing}` : ""}`,
      {
        method: request.method,
        headers,
        body: hasBody ? await request.text() : undefined,
        cache: "no-store",
      }
    )
    const text = await response.text()
    let payload: unknown = null
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = { message: text || "Respuesta invalida del backend" }
    }
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar al backend. Verifique que este activo." },
      { status: 503 }
    )
  }
}
