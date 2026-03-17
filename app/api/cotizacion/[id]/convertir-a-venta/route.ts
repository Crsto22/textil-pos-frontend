import { NextRequest, NextResponse } from "next/server"

import { appliesIgvForComprobante } from "@/lib/venta-tax"

const BACKEND_URL = process.env.BACKEND_URL
const SUNAT_RETRYABLE_STATES = new Set(["PENDIENTE", "OBSERVADO", "RECHAZADO", "ERROR"])

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizeUpperString(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : ""
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function shouldRetrySunat(estado: unknown): boolean {
  const normalized = normalizeUpperString(estado)
  return normalized.length === 0 || SUNAT_RETRYABLE_STATES.has(normalized)
}

function getPayloadCandidates(value: unknown): Record<string, unknown>[] {
  const source = asRecord(value)
  if (!source) return []

  return [source, source.response, source.data, source.venta]
    .map((candidate) => asRecord(candidate))
    .filter((candidate): candidate is Record<string, unknown> => candidate !== null)
}

function parseBackendPayload(text: string, fallbackMessage: string): Record<string, unknown> {
  if (!text.trim()) return { message: fallbackMessage }

  try {
    const parsed = JSON.parse(text)
    return asRecord(parsed) ?? { response: parsed }
  } catch {
    return { message: text || fallbackMessage }
  }
}

function getErrorMessage(payload: Record<string, unknown>, fallback: string): string {
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error
  }

  return fallback
}

function resolveTipoComprobante(requestPayload: unknown, responsePayload: unknown): string {
  const requestTipoComprobante = asRecord(requestPayload)?.tipoComprobante
  if (typeof requestTipoComprobante === "string" && requestTipoComprobante.trim()) {
    return requestTipoComprobante
  }

  for (const candidate of getPayloadCandidates(responsePayload)) {
    if (typeof candidate.tipoComprobante === "string" && candidate.tipoComprobante.trim()) {
      return candidate.tipoComprobante
    }
  }

  return ""
}

function extractVentaMeta(value: unknown) {
  for (const candidate of getPayloadCandidates(value)) {
    const idVenta = Number(candidate.idVenta ?? candidate.id_venta ?? candidate.id)
    if (!Number.isFinite(idVenta) || idVenta <= 0) continue

    return {
      idVenta,
      sunatEstado: stringOrNull(candidate.sunatEstado),
    }
  }

  return { idVenta: null, sunatEstado: null }
}

function extractSunatFields(value: unknown) {
  for (const candidate of getPayloadCandidates(value)) {
    const idVenta = Number(candidate.idVenta ?? candidate.id_venta ?? candidate.id)
    if (!Number.isFinite(idVenta) || idVenta <= 0) continue

    return {
      idVenta,
      sunatEstado: stringOrNull(candidate.sunatEstado),
      sunatCodigo: stringOrNull(candidate.sunatCodigo),
      sunatMensaje: stringOrNull(candidate.sunatMensaje),
      sunatXmlNombre: stringOrNull(candidate.sunatXmlNombre),
      sunatZipNombre: stringOrNull(candidate.sunatZipNombre),
      sunatCdrNombre: stringOrNull(candidate.sunatCdrNombre),
    }
  }

  return {
    idVenta: null,
    sunatEstado: null,
    sunatCodigo: null,
    sunatMensaje: null,
    sunatXmlNombre: null,
    sunatZipNombre: null,
    sunatCdrNombre: null,
  }
}

function mergeSunatResult(
  basePayload: Record<string, unknown>,
  retryPayload: unknown
): Record<string, unknown> {
  const sunatFields = extractSunatFields(retryPayload)
  const ventaPayload = asRecord(basePayload.venta)

  return {
    ...basePayload,
    idVenta: sunatFields.idVenta ?? basePayload.idVenta ?? null,
    sunatEstado: sunatFields.sunatEstado ?? basePayload.sunatEstado ?? null,
    sunatCodigo: sunatFields.sunatCodigo ?? basePayload.sunatCodigo ?? null,
    sunatMensaje: sunatFields.sunatMensaje ?? basePayload.sunatMensaje ?? null,
    sunatXmlNombre: sunatFields.sunatXmlNombre ?? basePayload.sunatXmlNombre ?? null,
    sunatZipNombre: sunatFields.sunatZipNombre ?? basePayload.sunatZipNombre ?? null,
    sunatCdrNombre: sunatFields.sunatCdrNombre ?? basePayload.sunatCdrNombre ?? null,
    venta: ventaPayload
      ? {
          ...ventaPayload,
          idVenta: sunatFields.idVenta ?? ventaPayload.idVenta ?? basePayload.idVenta ?? null,
          sunatEstado:
            sunatFields.sunatEstado ??
            stringOrNull(ventaPayload.sunatEstado) ??
            stringOrNull(basePayload.sunatEstado),
        }
      : basePayload.venta,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const { id } = await params
    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let requestPayload: unknown
    let body: string
    try {
      requestPayload = await request.json()
      body = JSON.stringify(requestPayload)
    } catch {
      return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/cotizacion/${encodeURIComponent(id)}/convertir-a-venta`,
        {
          method: "POST",
          headers,
          body,
        }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend. Verifique que este activo." },
        { status: 503 }
      )
    }

    const text = await backendRes.text()
    const data = parseBackendPayload(text, "Error desconocido")

    if (!backendRes.ok) {
      const message = getErrorMessage(data, "Error al convertir la cotizacion en venta")
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    const tipoComprobante = resolveTipoComprobante(requestPayload, data)
    const { idVenta, sunatEstado } = extractVentaMeta(data)

    if (
      !appliesIgvForComprobante(tipoComprobante) ||
      idVenta === null ||
      !shouldRetrySunat(sunatEstado)
    ) {
      return NextResponse.json(data, { status: backendRes.status })
    }

    try {
      const retryHeaders: HeadersInit = {}
      if (authHeader) {
        retryHeaders["Authorization"] = authHeader
      }

      const retryRes = await fetch(
        `${BACKEND_URL}/api/venta/${encodeURIComponent(String(idVenta))}/sunat/reintentar`,
        {
          method: "POST",
          headers: retryHeaders,
        }
      )

      const retryText = await retryRes.text()
      const retryPayload = parseBackendPayload(
        retryText,
        "No se pudo iniciar el envio automatico a SUNAT"
      )

      if (!retryRes.ok) {
        return NextResponse.json(
          {
            ...data,
            idVenta,
            sunatAutoDispatchTriggered: false,
            sunatAutoDispatchError: getErrorMessage(
              retryPayload,
              "No se pudo iniciar el envio automatico a SUNAT"
            ),
          },
          { status: backendRes.status }
        )
      }

      return NextResponse.json(
        {
          ...mergeSunatResult(data, retryPayload),
          sunatAutoDispatchTriggered: true,
          sunatAutoDispatchError: null,
        },
        { status: backendRes.status }
      )
    } catch (autoDispatchError) {
      console.error("[COTIZACION/CONVERTIR-A-VENTA][SUNAT_AUTO_DISPATCH]", autoDispatchError)

      return NextResponse.json(
        {
          ...data,
          idVenta,
          sunatAutoDispatchTriggered: false,
          sunatAutoDispatchError: "No se pudo iniciar el envio automatico a SUNAT",
        },
        { status: backendRes.status }
      )
    }
  } catch (error) {
    console.error("[COTIZACION/CONVERTIR-A-VENTA]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
