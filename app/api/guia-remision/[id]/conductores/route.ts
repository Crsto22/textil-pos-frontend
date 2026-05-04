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

/**
 * GET /api/guia-remision/[id]/conductores
 * Listar conductores de una guia de remision
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/conductores`,
        { headers }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudieron obtener los conductores")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/CONDUCTORES/LISTAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * POST /api/guia-remision/[id]/conductores
 * Crear conductor para una guia de remision
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
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
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/conductores`,
        { method: "POST", headers, body: JSON.stringify(normalized.data) }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo crear el conductor")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/CONDUCTORES/CREAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
