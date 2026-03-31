import { NextRequest, NextResponse } from "next/server"

import { getIdFromParams, proxyToBackend } from "../../_helpers"

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
