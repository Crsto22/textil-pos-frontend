import { NextRequest, NextResponse } from "next/server"

import {
  getProxyHeaders,
  normalizeCotizacionWritePayload,
  parseBackendBody,
} from "../_helpers"

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const requestPayload = await request.json().catch(() => null)
    const normalizedPayload = normalizeCotizacionWritePayload(requestPayload)
    if (!normalizedPayload.ok) {
      return NextResponse.json({ message: normalizedPayload.message }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/cotizacion/insertar`, {
        method: "POST",
        headers: getProxyHeaders(request, { includeJsonContentType: true }),
        body: JSON.stringify(normalizedPayload.data),
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    const { data, message } = await parseBackendBody(backendRes, "Error al registrar cotizacion")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[COTIZACION/INSERTAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
