import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      console.error("BACKEND_URL no esta configurado")
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let body: string
    try {
      body = JSON.stringify(await request.json())
    } catch {
      return NextResponse.json(
        { message: "Body invalido o vacio" },
        { status: 400 }
      )
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/empresa/insertar`, {
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
    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text || "Empresa creada exitosamente" }
    }

    if (!backendRes.ok) {
      const message =
        typeof data.message === "string"
          ? data.message
          : typeof data.error === "string"
            ? data.error
            : "Error al crear empresa"
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    return NextResponse.json(data, { status: backendRes.status || 201 })
  } catch (error) {
    console.error("[EMPRESA/INSERTAR]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
