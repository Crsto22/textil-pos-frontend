import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const PDF_CONTENT_TYPE = "application/pdf"
const ALLOWED_QUERY_KEYS = [
  "q",
  "estadoVenta",
  "idVenta",
  "idUsuario",
  "idMetodoPago",
  "idSucursal",
  "desde",
  "hasta",
] as const

function buildForwardQuery(request: NextRequest): string {
  const incomingSearchParams = new URL(request.url).searchParams
  const outgoingSearchParams = new URLSearchParams()

  ALLOWED_QUERY_KEYS.forEach((key) => {
    const value = incomingSearchParams.get(key)
    if (value !== null && value !== "") {
      outgoingSearchParams.set(key, value)
    }
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
    // ignore JSON parse errors
  }
  return { message: text || "No se pudo descargar el reporte de pagos en PDF" }
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

    const queryString = buildForwardQuery(request)
    let backendRes: Response

    try {
      backendRes = await fetch(`${BACKEND_URL}/api/pago/reporte/pdf${queryString}`, {
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
    const contentType = backendRes.headers.get("content-type") ?? PDF_CONTENT_TYPE
    const contentDisposition =
      backendRes.headers.get("content-disposition") ??
      `attachment; filename="reporte_pagos_${Date.now()}.pdf"`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[PAGO/REPORTE/PDF]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
