import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
  parseBackendBody,
} from "@/app/api/guia-remision/_helpers"

const TIPOS_DOCUMENTO_PERMITIDOS = new Set(["01", "03"])

/**
 * GET /api/guia-remision/autocompletar/venta
 * Busca una factura o boleta emitida para precargar una guia de remision.
 */
export async function GET(request: NextRequest) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const incomingParams = new URL(request.url).searchParams
    const tipoDocumento = incomingParams.get("tipoDocumento")?.trim()
    const serie = incomingParams.get("serie")?.trim().toUpperCase()
    const numero = incomingParams.get("numero")?.trim()

    if (tipoDocumento && !TIPOS_DOCUMENTO_PERMITIDOS.has(tipoDocumento)) {
      return NextResponse.json(
        { message: "tipoDocumento invalido. Use 01 para factura o 03 para boleta" },
        { status: 400 }
      )
    }

    if (!serie) {
      return NextResponse.json({ message: "serie es obligatoria" }, { status: 400 })
    }

    if (!numero || !/^\d{1,8}$/.test(numero)) {
      return NextResponse.json({ message: "numero invalido" }, { status: 400 })
    }

    const outgoingParams = new URLSearchParams({ serie, numero })
    if (tipoDocumento) {
      outgoingParams.set("tipoDocumento", tipoDocumento)
    }

    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/autocompletar/venta?${outgoingParams.toString()}`,
        { headers }
      )
    } catch {
      return backendConnectionError()
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "No se pudo autocompletar la guia desde la venta"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[GUIA-REMISION/AUTOCOMPLETAR-VENTA]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
