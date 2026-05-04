import { deprecatedEndpointResponse } from "@/app/api/guia-remision/_helpers"

export async function POST() {
  return deprecatedEndpointResponse(
    "La ruta /api/guia-remision/{id}/sunat/consultar-ticket ya no esta vigente en el flujo actual."
  )
}
