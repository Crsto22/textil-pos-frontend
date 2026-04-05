import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

type TrasladoItemBody = {
  idProductoVariante: number
  cantidad: number
}

type TrasladoInsertBody = {
  idSucursalOrigen: number
  idSucursalDestino: number
  items: TrasladoItemBody[]
  motivo?: string
}

function toPositiveInteger(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN

  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function sanitizeItem(item: unknown): { ok: true; data: TrasladoItemBody } | { ok: false; message: string } {
  if (!item || typeof item !== "object") {
    return { ok: false, message: "Cada item debe ser un objeto con idProductoVariante y cantidad" }
  }

  const obj = item as Record<string, unknown>
  const idProductoVariante = toPositiveInteger(obj.idProductoVariante)
  if (!idProductoVariante) {
    return { ok: false, message: "idProductoVariante es obligatorio y debe ser un entero mayor a 0" }
  }

  const cantidad = toPositiveInteger(obj.cantidad)
  if (!cantidad) {
    return { ok: false, message: "cantidad es obligatoria y debe ser un entero mayor a 0" }
  }

  return { ok: true, data: { idProductoVariante, cantidad } }
}

function sanitizeInsertBody(payload: unknown): { ok: true; data: TrasladoInsertBody } | { ok: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Body invalido o vacio" }
  }

  const body = payload as Record<string, unknown>
  const idSucursalOrigen = toPositiveInteger(body.idSucursalOrigen)
  if (!idSucursalOrigen) {
    return { ok: false, message: "idSucursalOrigen es obligatorio y debe ser un entero mayor a 0" }
  }

  const idSucursalDestino = toPositiveInteger(body.idSucursalDestino)
  if (!idSucursalDestino) {
    return { ok: false, message: "idSucursalDestino es obligatorio y debe ser un entero mayor a 0" }
  }

  if (idSucursalOrigen === idSucursalDestino) {
    return { ok: false, message: "La sucursal origen y destino no pueden ser la misma" }
  }

  // Validar items
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false, message: "Ingrese al menos un producto para trasladar" }
  }

  const items: TrasladoItemBody[] = []
  const seenVariantes = new Set<number>()
  for (const raw of body.items) {
    const result = sanitizeItem(raw)
    if (!result.ok) return result

    if (seenVariantes.has(result.data.idProductoVariante)) {
      return { ok: false, message: "No se permite repetir la misma variante en un traslado grupal" }
    }
    seenVariantes.add(result.data.idProductoVariante)
    items.push(result.data)
  }

  let motivo: string | undefined
  if (body.motivo !== undefined && body.motivo !== null) {
    if (typeof body.motivo !== "string") {
      return { ok: false, message: "motivo debe ser un texto" }
    }

    const trimmedMotivo = body.motivo.trim()
    if (trimmedMotivo.length > 255) {
      return { ok: false, message: "motivo no puede exceder 255 caracteres" }
    }

    if (trimmedMotivo.length > 0) {
      motivo = trimmedMotivo
    }
  }

  return {
    ok: true,
    data: {
      idSucursalOrigen,
      idSucursalDestino,
      items,
      ...(motivo ? { motivo } : {}),
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let body: string
    try {
      const rawBody = await request.json()
      const parsedBody = sanitizeInsertBody(rawBody)
      if (!parsedBody.ok) {
        return NextResponse.json({ message: parsedBody.message }, { status: 400 })
      }

      body = JSON.stringify(parsedBody.data)
    } catch {
      return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/traslado/insertar`, {
        method: "POST",
        headers,
        body,
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor. Verifique que el backend este activo." },
        { status: 503 }
      )
    }

    const text = await backendRes.text()
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text || "Traslado registrado exitosamente" }
    }

    if (!backendRes.ok) {
      const message = typeof payload.message === "string" ? payload.message : "Error al registrar traslado"
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(payload, { status: backendRes.status || 201 })
  } catch (error) {
    console.error("[TRASLADO/INSERTAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
