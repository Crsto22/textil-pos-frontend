import { NextRequest, NextResponse } from "next/server"

import {
  getProxyHeaders,
  normalizeCotizacionEstadoEditable,
  parseBackendBody,
} from "../../_helpers"

const BACKEND_URL = process.env.BACKEND_URL

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const { id } = await params
    const requestPayload = await request.json().catch(() => null)
    const payload =
      requestPayload && typeof requestPayload === "object"
        ? (requestPayload as Record<string, unknown>)
        : null
    const rawEstado =
      payload && "estado" in payload ? payload.estado : null
    const estado = normalizeCotizacionEstadoEditable(rawEstado)
    if (!estado) {
      return NextResponse.json(
        { message: "Estado permitido para cotizacion: ACTIVA" },
        { status: 400 }
      )
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/cotizacion/estado/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: getProxyHeaders(request, { includeJsonContentType: true }),
        body: JSON.stringify({ estado }),
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "Error al actualizar el estado de la cotizacion"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[COTIZACION/ESTADO]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
