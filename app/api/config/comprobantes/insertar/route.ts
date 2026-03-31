import { NextRequest } from "next/server"

import { getJsonBody, proxyToBackend } from "../_helpers"

export async function POST(request: NextRequest) {
  const bodyResult = await getJsonBody(request)
  if (!bodyResult.ok) {
    return bodyResult.response
  }

  return proxyToBackend({
    request,
    backendPath: "/api/config/comprobantes",
    fallbackMessage: "Error al crear configuracion de comprobante",
    method: "POST",
    body: bodyResult.body,
    includeJsonContentType: true,
    successStatus: 201,
  })
}
