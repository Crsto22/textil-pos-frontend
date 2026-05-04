import { NextRequest, NextResponse } from "next/server"

import {
  getJsonBody,
  normalizeActivo,
  proxyToBackend,
} from "./_helpers"

function buildListParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const backendParams = new URLSearchParams()

  const rawActivo = searchParams.get("activo")
  const habilitadoVenta = searchParams.get("habilitadoVenta")?.trim()

  if (rawActivo !== null) {
    const activo = normalizeActivo(rawActivo)
    if (!activo) return null
    backendParams.set("activo", activo)
  }

  if (habilitadoVenta) {
    backendParams.set("habilitadoVenta", habilitadoVenta)
  }

  return backendParams
}

export async function GET(request: NextRequest) {
  const backendParams = buildListParams(request)

  if (!backendParams) {
    return NextResponse.json(
      { message: "activo permitido: ACTIVO o INACTIVO" },
      { status: 400 }
    )
  }

  const queryString = backendParams.toString()

  return proxyToBackend({
    request,
    backendPath: `/api/config/comprobantes${queryString ? `?${queryString}` : ""}`,
    fallbackMessage: "Error al listar configuraciones de comprobantes",
    cache: "no-store",
  })
}

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
