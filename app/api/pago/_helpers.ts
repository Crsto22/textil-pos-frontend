import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  const source = asRecord(payload)
  if (!source) {
    return fallbackMessage
  }

  if (typeof source.message === "string" && source.message.trim()) {
    return source.message
  }

  if (typeof source.error === "string" && source.error.trim()) {
    return source.error
  }

  return fallbackMessage
}

function buildPagoUpdateBody(payload: unknown): { ok: true; body: string } | { ok: false; message: string } {
  const source = asRecord(payload)
  if (!source) {
    return { ok: false, message: "Body invalido o vacio" }
  }

  const hasCodigoOperacion = Object.prototype.hasOwnProperty.call(source, "codigoOperacion")
  const hasFecha = Object.prototype.hasOwnProperty.call(source, "fecha")

  if (!hasCodigoOperacion && !hasFecha) {
    return { ok: false, message: "Debe enviar codigoOperacion o fecha" }
  }

  const normalized: Record<string, string | null> = {}

  if (hasCodigoOperacion) {
    const value = source.codigoOperacion
    if (value === null) {
      normalized.codigoOperacion = null
    } else if (typeof value === "string") {
      const codigoOperacion = value.trim()
      if (!codigoOperacion) {
        return { ok: false, message: "codigoOperacion no puede estar vacio" }
      }

      if (codigoOperacion.length > 100) {
        return { ok: false, message: "codigoOperacion no puede exceder los 100 caracteres" }
      }

      normalized.codigoOperacion = codigoOperacion
    } else {
      return { ok: false, message: "codigoOperacion debe ser texto" }
    }
  }

  if (hasFecha) {
    const value = source.fecha
    if (value === null) {
      normalized.fecha = null
    } else if (typeof value === "string") {
      const fecha = value.trim()
      if (!fecha) {
        return { ok: false, message: "fecha no puede estar vacia" }
      }

      normalized.fecha = fecha
    } else {
      return { ok: false, message: "fecha debe ser texto" }
    }
  }

  return { ok: true, body: JSON.stringify(normalized) }
}

async function parseBackendResponse(response: Response, fallbackMessage: string) {
  const text = await response.text()
  if (!text) {
    return response.ok ? {} : { message: fallbackMessage }
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text || fallbackMessage }
  }
}

export async function forwardPagoUpdate(request: NextRequest, idPago: string, backendPath: string) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "Error de configuracion del servidor" }, { status: 500 })
  }

  const authHeader = request.headers.get("authorization")
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }
  if (authHeader) {
    headers.Authorization = authHeader
  }

  let parsedPayload: unknown
  try {
    parsedPayload = await request.json()
  } catch {
    return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
  }

  const normalizedBody = buildPagoUpdateBody(parsedPayload)
  if (!normalizedBody.ok) {
    return NextResponse.json({ message: normalizedBody.message }, { status: 400 })
  }

  let backendRes: Response
  try {
    backendRes = await fetch(
      `${BACKEND_URL}/api/pago/${encodeURIComponent(idPago)}${backendPath}`,
      {
        method: "PUT",
        headers,
        body: normalizedBody.body,
      }
    )
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar al servidor. Verifique que el backend este activo." },
      { status: 503 }
    )
  }

  const payload = await parseBackendResponse(backendRes, "Error al actualizar pago")

  if (!backendRes.ok) {
    const message = getErrorMessage(payload, "Error al actualizar pago")
    return NextResponse.json({ message }, { status: backendRes.status })
  }

  return NextResponse.json(payload, { status: backendRes.status })
}
