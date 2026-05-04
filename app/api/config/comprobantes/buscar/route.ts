import { NextRequest, NextResponse } from "next/server"

import { normalizeActivo, proxyToBackend } from "../_helpers"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const backendParams = new URLSearchParams()

  const q = searchParams.get("q")?.trim() ?? ""
  const page = searchParams.get("page")?.trim() || "0"
  const rawActivo = searchParams.get("activo")
  const habilitadoVenta = searchParams.get("habilitadoVenta")?.trim()

  backendParams.set("q", q)
  backendParams.set("page", page)

  if (rawActivo !== null) {
    const activo = normalizeActivo(rawActivo)
    if (!activo) {
      return NextResponse.json(
        { message: "activo permitido: ACTIVO o INACTIVO" },
        { status: 400 }
      )
    }

    backendParams.set("activo", activo)
  }

  if (habilitadoVenta) {
    backendParams.set("habilitadoVenta", habilitadoVenta)
  }

  return proxyToBackend({
    request,
    backendPath: `/api/config/comprobantes/buscar?${backendParams.toString()}`,
    fallbackMessage: "Error al buscar configuraciones de comprobantes",
    cache: "no-store",
  })
}
