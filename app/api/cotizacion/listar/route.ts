import { NextRequest, NextResponse } from "next/server"

import { getProxyHeaders, normalizeCotizacionEstado, parseBackendBody } from "../_helpers"

const BACKEND_URL = process.env.BACKEND_URL
const ALLOWED_QUERY_KEYS = [
  "q",
  "estado",
  "periodo",
  "fecha",
  "desde",
  "hasta",
  "idUsuario",
  "idSucursal",
  "page",
] as const

function buildForwardQuery(
  request: NextRequest
): { queryString: string; invalidMessage: string | null } {
  const incomingSearchParams = new URL(request.url).searchParams
  const outgoingSearchParams = new URLSearchParams()
  let invalidMessage: string | null = null

  ALLOWED_QUERY_KEYS.forEach((key) => {
    const value = incomingSearchParams.get(key)
    if (value !== null && value !== "") {
      if (key === "estado") {
        const normalizedEstado = normalizeCotizacionEstado(value)
        if (!normalizedEstado) {
          invalidMessage = "estado permitido: ACTIVA o CONVERTIDA"
          return
        }

        outgoingSearchParams.set(key, normalizedEstado)
        return
      }

      outgoingSearchParams.set(key, value)
    }
  })

  if (!outgoingSearchParams.has("page")) {
    outgoingSearchParams.set("page", "0")
  }

  const queryString = outgoingSearchParams.toString()
  return {
    queryString: queryString ? `?${queryString}` : "",
    invalidMessage,
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const { queryString, invalidMessage } = buildForwardQuery(request)
    if (invalidMessage) {
      return NextResponse.json({ message: invalidMessage }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/cotizacion/listar${queryString}`, {
        headers: getProxyHeaders(request),
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    const { data } = await parseBackendBody(
      backendRes,
      "Error inesperado al listar cotizaciones"
    )

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[COTIZACION/LISTAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
