import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  RouteContext,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
  normalizeVehiculo,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

/**
 * GET /api/guia-remision/[id]/vehiculos
 * Listar vehiculos de una guia de remision
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
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/vehiculos`,
        { headers }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudieron obtener los vehiculos")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/VEHICULOS/LISTAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * POST /api/guia-remision/[id]/vehiculos
 * Crear vehiculo para una guia de remision
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const rawBody = await request.json().catch(() => null)
    const normalized = normalizeVehiculo(rawBody, 0)
    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    const { id } = await params
    const headers = getProxyHeaders(request, { includeJsonContentType: true })

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/vehiculos`,
        { method: "POST", headers, body: JSON.stringify(normalized.data) }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo crear el vehiculo")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/VEHICULOS/CREAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
