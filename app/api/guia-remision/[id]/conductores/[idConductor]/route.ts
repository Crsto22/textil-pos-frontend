import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
  normalizeConductor,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

type ConductorRouteContext = { params: Promise<{ id: string; idConductor: string }> }

/**
 * GET /api/guia-remision/[id]/conductores/[idConductor]
 * Obtener un conductor de una guia de remision
 */
export async function GET(request: NextRequest, { params }: ConductorRouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id, idConductor } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/conductores/${encodeURIComponent(idConductor)}`,
        { headers }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se encontro el conductor")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/CONDUCTORES/OBTENER]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * PUT /api/guia-remision/[id]/conductores/[idConductor]
 * Actualizar un conductor de una guia de remision
 */
export async function PUT(request: NextRequest, { params }: ConductorRouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const rawBody = await request.json().catch(() => null)
    const normalized = normalizeConductor(rawBody, 0)
    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    const { id, idConductor } = await params
    const headers = getProxyHeaders(request, { includeJsonContentType: true })

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/conductores/${encodeURIComponent(idConductor)}`,
        { method: "PUT", headers, body: JSON.stringify(normalized.data) }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo actualizar el conductor")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/CONDUCTORES/ACTUALIZAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * DELETE /api/guia-remision/[id]/conductores/[idConductor]
 * Eliminar (borrado logico) un conductor de una guia de remision
 */
export async function DELETE(request: NextRequest, { params }: ConductorRouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id, idConductor } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/conductores/${encodeURIComponent(idConductor)}`,
        { method: "DELETE", headers }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo eliminar el conductor")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/CONDUCTORES/ELIMINAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
