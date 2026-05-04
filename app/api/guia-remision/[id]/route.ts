import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  RouteContext,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
  normalizeGuiaRemisionWritePayload,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

/**
 * GET /api/guia-remision/[id]
 * Detalle de una guia de remision
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
      "No se encontro la guia de remision"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/DETALLE]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * PATCH /api/guia-remision/[id]
 * Editar guia de remision
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const rawBody = await request.json().catch(() => null)
    const normalizedBody = normalizeGuiaRemisionWritePayload(rawBody, { partial: true })
    if (!normalizedBody.ok) {
      return NextResponse.json({ message: normalizedBody.message }, { status: 400 })
    }

    const { id } = await params
    const headers = getProxyHeaders(request, { includeJsonContentType: true })

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(normalizedBody.data),
      })
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "No se pudo editar la guia de remision"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/EDITAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * DELETE /api/guia-remision/[id]
 * Anular guia de remision
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      })
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "No se pudo anular la guia de remision"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/ANULAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
