import { NextRequest, NextResponse } from "next/server"

import {
  getIdFromParams,
  getJsonBody,
  proxyToBackend,
} from "../_helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await getIdFromParams(params)
  if (!id) {
    return NextResponse.json({ message: "ID invalido" }, { status: 400 })
  }

  return proxyToBackend({
    request,
    backendPath: `/api/config/comprobantes/${encodeURIComponent(id)}`,
    fallbackMessage: "Error al obtener configuracion de comprobante",
    cache: "no-store",
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await getIdFromParams(params)
  if (!id) {
    return NextResponse.json({ message: "ID invalido" }, { status: 400 })
  }

  const bodyResult = await getJsonBody(request)
  if (!bodyResult.ok) {
    return bodyResult.response
  }

  return proxyToBackend({
    request,
    backendPath: `/api/config/comprobantes/${encodeURIComponent(id)}`,
    fallbackMessage: "Error al actualizar configuracion de comprobante",
    method: "PUT",
    body: bodyResult.body,
    includeJsonContentType: true,
  })
}

/**
 * Backwards-compatible alias for DELETE /api/config/comprobantes/eliminar/[id].
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await getIdFromParams(params)
  if (!id) {
    return NextResponse.json({ message: "ID invalido" }, { status: 400 })
  }

  return proxyToBackend({
    request,
    backendPath: `/api/config/comprobantes/eliminar/${encodeURIComponent(id)}`,
    fallbackMessage: "Error al eliminar configuracion de comprobante",
    method: "DELETE",
  })
}
