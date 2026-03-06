import { NextRequest, NextResponse } from "next/server"

import { getProxyHeaders, parseBackendBody } from "../_helpers"

const BACKEND_URL = process.env.BACKEND_URL

async function getIdFromParams(
  params: Promise<{ id: string }>
): Promise<string | null> {
  const { id } = await params
  const normalizedId = id?.trim()
  if (!normalizedId) return null
  return normalizedId
}

/**
 * GET /api/config/comprobantes/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const id = await getIdFromParams(params)
    if (!id) {
      return NextResponse.json({ message: "ID invalido" }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/config/comprobantes/${encodeURIComponent(id)}`,
        {
          headers: getProxyHeaders(request),
          cache: "no-store",
        }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend." },
        { status: 503 }
      )
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "Error al obtener configuracion de comprobante"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[CONFIG/COMPROBANTES/DETALLE]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * PUT /api/config/comprobantes/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const id = await getIdFromParams(params)
    if (!id) {
      return NextResponse.json({ message: "ID invalido" }, { status: 400 })
    }

    let body: string
    try {
      body = JSON.stringify(await request.json())
    } catch {
      return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/config/comprobantes/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: getProxyHeaders(request, { includeJsonContentType: true }),
          body,
        }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend." },
        { status: 503 }
      )
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "Error al actualizar configuracion de comprobante"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[CONFIG/COMPROBANTES/ACTUALIZAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * DELETE /api/config/comprobantes/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const id = await getIdFromParams(params)
    if (!id) {
      return NextResponse.json({ message: "ID invalido" }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(
        `${BACKEND_URL}/api/config/comprobantes/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: getProxyHeaders(request),
        }
      )
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend." },
        { status: 503 }
      )
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "Error al eliminar configuracion de comprobante"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[CONFIG/COMPROBANTES/ELIMINAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
