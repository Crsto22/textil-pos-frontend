import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  RouteContext,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/emitir`, {
        method: "POST",
        headers,
      })
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "No se pudo emitir la guia de remision"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[GUIA-REMISION/EMITIR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
