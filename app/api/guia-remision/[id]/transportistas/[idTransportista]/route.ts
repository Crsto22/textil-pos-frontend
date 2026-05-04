import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
  normalizeTransportista,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

type TransportistaRouteContext = { params: Promise<{ id: string; idTransportista: string }> }

/**
 * GET /api/guia-remision/[id]/transportistas/[idTransportista]
 * Obtener un transportista de una guia de remision
 */
export async function GET(request: NextRequest, { params }: TransportistaRouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id, idTransportista } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/transportistas/${encodeURIComponent(idTransportista)}`,
        { headers }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se encontro el transportista")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/TRANSPORTISTAS/OBTENER]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * PUT /api/guia-remision/[id]/transportistas/[idTransportista]
 * Actualizar un transportista de una guia de remision
 */
export async function PUT(request: NextRequest, { params }: TransportistaRouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const rawBody = await request.json().catch(() => null)
    const normalized = normalizeTransportista(rawBody, 0)
    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    const { id, idTransportista } = await params
    const headers = getProxyHeaders(request, { includeJsonContentType: true })

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/transportistas/${encodeURIComponent(idTransportista)}`,
        { method: "PUT", headers, body: JSON.stringify(normalized.data) }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo actualizar el transportista")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/TRANSPORTISTAS/ACTUALIZAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * DELETE /api/guia-remision/[id]/transportistas/[idTransportista]
 * Eliminar (borrado logico) un transportista de una guia de remision
 */
export async function DELETE(request: NextRequest, { params }: TransportistaRouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id, idTransportista } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/transportistas/${encodeURIComponent(idTransportista)}`,
        { method: "DELETE", headers }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo eliminar el transportista")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/TRANSPORTISTAS/ELIMINAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
