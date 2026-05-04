import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  backendConnectionError,
  buildForwardQuery,
  ensureBackendUrl,
  getProxyHeaders,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

const ALLOWED_QUERY_KEYS = ["page", "q", "idSucursal", "estado", "sunatEstado"] as const

/**
 * GET /api/guia-remision/listar
 * Alias de compatibilidad que ahora consulta el endpoint nuevo /api/guia-remision
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
    console.error("[GUIA-REMISION/LISTAR-ALIAS]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
