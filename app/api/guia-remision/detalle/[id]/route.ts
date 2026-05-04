import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  RouteContext,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

/**
 * GET /api/guia-remision/detalle/[id]
 * Alias de compatibilidad que ahora consulta /api/guia-remision/{id}
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}`, {
        headers,
      })
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "No se encontro el detalle de la guia de remision"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/DETALLE/ALIAS]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
