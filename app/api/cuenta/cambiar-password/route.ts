import { NextRequest, NextResponse } from "next/server"
import type { ChangePasswordRequest } from "@/lib/auth/types"
import { safeParseJson } from "../../auth/_helpers"

const BACKEND_URL = process.env.BACKEND_URL

function isValidBody(body: unknown): body is ChangePasswordRequest {
  if (!body || typeof body !== "object") return false

  const payload = body as Partial<ChangePasswordRequest>
  return (
    typeof payload.passwordActual === "string" &&
    payload.passwordActual.trim() !== "" &&
    typeof payload.passwordNueva === "string" &&
    payload.passwordNueva.trim() !== "" &&
    typeof payload.confirmarPassword === "string" &&
    payload.confirmarPassword.trim() !== ""
  )
}

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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { message: "Body invalido o vacio" },
        { status: 400 }
      )
    }

    if (!isValidBody(body)) {
      return NextResponse.json(
        { message: "Debe enviar passwordActual, passwordNueva y confirmarPassword" },
        { status: 400 }
      )
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (authHeader) headers["Authorization"] = authHeader

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/auth/cambiar-password`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor. Verifique que el backend este activo." },
        { status: 503 }
      )
    }

    const { message } = await safeParseJson(
      backendRes,
      "Error al cambiar contrasena"
    )

    return NextResponse.json({ message }, { status: backendRes.status })
  } catch (error) {
    console.error("[CUENTA/CAMBIAR-PASSWORD]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
