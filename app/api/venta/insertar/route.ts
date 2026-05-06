import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function normalizeIgvPorcentaje(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return null
  }

  return parsed
}

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let body: string
    try {
      const payload = await request.json()
      const normalizedPayload = asRecord(payload)
      if (!normalizedPayload) {
        return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
      }

      if (normalizedPayload.igvPorcentaje !== undefined) {
        const igvPorcentaje = normalizeIgvPorcentaje(normalizedPayload.igvPorcentaje)
        if (igvPorcentaje === null) {
          return NextResponse.json({ message: "igvPorcentaje invalido" }, { status: 400 })
        }

        normalizedPayload.igvPorcentaje = igvPorcentaje
      }

      body = JSON.stringify(normalizedPayload)
    } catch {
      return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/venta/insertar`, {
        method: "POST",
        headers,
        body,
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    const text = await backendRes.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text || "Error desconocido" }
    }

    if (!backendRes.ok) {
      const rec = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
      const message =
        typeof rec.message === "string" ? rec.message :
        typeof rec.error === "string" ? rec.error :
        "Error al registrar venta"
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[VENTA/INSERTAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
