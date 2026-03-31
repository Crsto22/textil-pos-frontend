import { NextRequest, NextResponse } from "next/server"

import { getIdFromParams, proxyToBackend } from "../../_helpers"

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
