import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
  normalizeVehiculo,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

type VehiculoRouteContext = { params: Promise<{ id: string; idVehiculo: string }> }

/**
 * GET /api/guia-remision/[id]/vehiculos/[idVehiculo]
 * Obtener un vehiculo de una guia de remision
 */
export async function GET(request: NextRequest, { params }: VehiculoRouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id, idVehiculo } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/vehiculos/${encodeURIComponent(idVehiculo)}`,
        { headers }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se encontro el vehiculo")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/VEHICULOS/OBTENER]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * PUT /api/guia-remision/[id]/vehiculos/[idVehiculo]
 * Actualizar un vehiculo de una guia de remision
 */
export async function PUT(request: NextRequest, { params }: VehiculoRouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const rawBody = await request.json().catch(() => null)
    const normalized = normalizeVehiculo(rawBody, 0)
    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    const { id, idVehiculo } = await params
    const headers = getProxyHeaders(request, { includeJsonContentType: true })

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/vehiculos/${encodeURIComponent(idVehiculo)}`,
        { method: "PUT", headers, body: JSON.stringify(normalized.data) }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo actualizar el vehiculo")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/VEHICULOS/ACTUALIZAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * DELETE /api/guia-remision/[id]/vehiculos/[idVehiculo]
 * Eliminar (borrado logico) un vehiculo de una guia de remision
 */
export async function DELETE(request: NextRequest, { params }: VehiculoRouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id, idVehiculo } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/vehiculos/${encodeURIComponent(idVehiculo)}`,
        { method: "DELETE", headers }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(backendRes, "No se pudo eliminar el vehiculo")

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/VEHICULOS/ELIMINAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
