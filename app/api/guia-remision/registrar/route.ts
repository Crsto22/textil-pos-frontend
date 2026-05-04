import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
  normalizeGuiaRemisionWritePayload,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

/**
 * POST /api/guia-remision/registrar
 * Alias de compatibilidad que ahora usa el endpoint nuevo /api/guia-remision
 */
export async function POST(request: NextRequest) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const rawBody = await request.json().catch(() => null)
    const normalizedBody = normalizeGuiaRemisionWritePayload(rawBody)
    if (!normalizedBody.ok) {
      return NextResponse.json({ message: normalizedBody.message }, { status: 400 })
    }

    const headers = getProxyHeaders(request, { includeJsonContentType: true })

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/guia-remision`, {
        method: "POST",
        headers,
        body: JSON.stringify(normalizedBody.data),
      })
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "Error al registrar guia de remision"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/REGISTRAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
