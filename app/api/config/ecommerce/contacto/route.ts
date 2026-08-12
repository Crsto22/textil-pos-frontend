import { NextRequest } from "next/server"

import { getJsonBody, proxyToBackend } from "../../comprobantes/_helpers"

export async function GET(request: NextRequest) {
  return proxyToBackend({
    request,
    backendPath: "/api/config/ecommerce/contacto",
    fallbackMessage: "Error al obtener contacto ecommerce",
    cache: "no-store",
  })
}

export async function PUT(request: NextRequest) {
  const parsed = await getJsonBody(request)
  if (!parsed.ok) return parsed.response

  return proxyToBackend({
    request,
    backendPath: "/api/config/ecommerce/contacto",
    fallbackMessage: "Error al guardar contacto ecommerce",
    method: "PUT",
    body: parsed.body,
    includeJsonContentType: true,
    cache: "no-store",
  })
}
