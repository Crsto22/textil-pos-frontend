import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  RouteContext,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
  normalizeConductor,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

const BASE = `${BACKEND_URL}/api/guia-remision/catalogos/conductores`

/**
 * GET /api/guia-remision/catalogos/conductores/[id]
 * Obtener un conductor del catalogo por ID
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(`${BASE}/${encodeURIComponent(id)}`, { headers })
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se encontro el conductor")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[CATALOGOS/CONDUCTORES/OBTENER]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * PUT /api/guia-remision/catalogos/conductores/[id]
 * Actualizar un conductor del catalogo
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const rawBody = await request.json().catch(() => null)
    const normalized = normalizeConductor(rawBody, 0)
    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    const { id } = await params
    const headers = getProxyHeaders(request, { includeJsonContentType: true })

    let backendRes: Response
    try {
      backendRes = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(normalized.data),
      })
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo actualizar el conductor")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[CATALOGOS/CONDUCTORES/ACTUALIZAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * DELETE /api/guia-remision/catalogos/conductores/[id]
 * Eliminar logicamente un conductor del catalogo
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      })
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo eliminar el conductor")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[CATALOGOS/CONDUCTORES/ELIMINAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
