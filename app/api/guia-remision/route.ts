import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  backendConnectionError,
  buildForwardQuery,
  ensureBackendUrl,
  getProxyHeaders,
  normalizeGuiaRemisionWritePayload,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

const ALLOWED_QUERY_KEYS = ["page", "q", "idSucursal", "estado", "sunatEstado"] as const

/**
 * GET /api/guia-remision
 * Listar guias de remision
 */
export async function GET(request: NextRequest) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const queryString = buildForwardQuery(request, ALLOWED_QUERY_KEYS, { page: "0" })
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/guia-remision${queryString}`, {
        headers,
      })
    } catch {
      return backendConnectionError()
    }

    const { data } = await parseBackendBody(
      backendRes,
      "Error al listar guias de remision"
    )

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/LISTAR-ROOT]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * POST /api/guia-remision
 * Crear guia de remision con el flujo nuevo
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
      "Error al crear guia de remision"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/CREAR-ROOT]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
