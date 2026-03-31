import { NextRequest, NextResponse } from "next/server"

import {
  getIdFromParams,
  getJsonBody,
  proxyToBackend,
} from "../../_helpers"

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
