import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  backendConnectionError,
  buildForwardQuery,
  ensureBackendUrl,
  getProxyHeaders,
  normalizeVehiculo,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

const BASE = `${BACKEND_URL}/api/guia-remision/catalogos/vehiculos`

/**
 * GET /api/guia-remision/catalogos/vehiculos
 * Listar vehiculos del catalogo (soporta ?q= y ?page=)
 */
export async function GET(request: NextRequest) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const query = buildForwardQuery(request, ["q", "page", "size"])
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(`${BASE}${query}`, { headers })
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudieron cargar los vehiculos")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[CATALOGOS/VEHICULOS/LISTAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * POST /api/guia-remision/catalogos/vehiculos
 * Crear vehiculo en el catalogo
 */
export async function POST(request: NextRequest) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const rawBody = await request.json().catch(() => null)
    const normalized = normalizeVehiculo(rawBody, 0)
    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    const headers = getProxyHeaders(request, { includeJsonContentType: true })

    let backendRes: Response
    try {
      backendRes = await fetch(BASE, {
        method: "POST",
        headers,
        body: JSON.stringify(normalized.data),
      })
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo crear el vehiculo")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[CATALOGOS/VEHICULOS/CREAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
