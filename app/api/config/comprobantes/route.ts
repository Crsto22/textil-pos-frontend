import { NextRequest, NextResponse } from "next/server"

import {
  getProxyHeaders,
  normalizeActivo,
  parseBackendBody,
} from "./_helpers"

const BACKEND_URL = process.env.BACKEND_URL

/**
 * GET /api/config/comprobantes
 * Optional query params: activo, idSucursal
 */
export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const rawActivo = searchParams.get("activo")
    const idSucursal = searchParams.get("idSucursal")?.trim()

    const backendParams = new URLSearchParams()

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

    if (idSucursal) {
      backendParams.set("idSucursal", idSucursal)
    }

    const queryString = backendParams.toString()
    const backendUrl = `${BACKEND_URL}/api/config/comprobantes${queryString ? `?${queryString}` : ""}`

    let backendRes: Response
    try {
      backendRes = await fetch(backendUrl, {
        headers: getProxyHeaders(request),
        cache: "no-store",
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend." },
        { status: 503 }
      )
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "Error al listar configuraciones de comprobantes"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[CONFIG/COMPROBANTES]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * POST /api/config/comprobantes
 */
export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
    }

    let body: string
    try {
      body = JSON.stringify(await request.json())
    } catch {
      return NextResponse.json({ message: "Body invalido o vacio" }, { status: 400 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/config/comprobantes`, {
        method: "POST",
        headers: getProxyHeaders(request, { includeJsonContentType: true }),
        body,
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al backend." },
        { status: 503 }
      )
    }

    const { data, message } = await parseBackendBody(
      backendRes,
      "Error al crear configuracion de comprobante"
    )

    if (!backendRes.ok) {
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status || 201 })
  } catch (error) {
    console.error("[CONFIG/COMPROBANTES/CREAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
