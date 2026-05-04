import { NextRequest, NextResponse } from "next/server"

import {
  BACKEND_URL,
  type RouteContext,
  backendConnectionError,
  ensureBackendUrl,
  getProxyHeaders,
} from "@/app/api/guia-remision/_helpers"

const PDF_CONTENT_TYPE = "application/pdf"

async function parseErrorResponse(response: Response) {
  const text = await response.text()
  try {
    const parsed = JSON.parse(text) as { message?: string }
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return { message: parsed.message }
    }
  } catch {
    // ignore JSON parse errors
  }
  return { message: text || "No se pudo descargar la guia de remision en PDF" }
}

/**
 * GET /api/guia-remision/[id]/pdf
 * Descarga la guia de remision en formato PDF (conforme SUNAT para GRE).
 * Disponible desde que la guia existe (BORRADOR o EMITIDA).
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const backendError = ensureBackendUrl()
    if (backendError) return backendError

    const { id } = await params
    const headers = getProxyHeaders(request)

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/guia-remision/${encodeURIComponent(id)}/pdf`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      )
    } catch {
      return backendConnectionError()
    }

    if (!backendRes.ok) {
      const payload = await parseErrorResponse(backendRes)
      return NextResponse.json(payload, { status: backendRes.status })
    }

    const fileBuffer = await backendRes.arrayBuffer()
    const contentType = backendRes.headers.get("content-type") ?? PDF_CONTENT_TYPE
    const contentDisposition =
      backendRes.headers.get("content-disposition") ??
      `attachment; filename="guia-remision-${encodeURIComponent(id)}.pdf"`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[GUIA-REMISION/PDF]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
