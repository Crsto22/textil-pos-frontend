import { NextRequest, NextResponse } from "next/server"
import type { BackendLoginResponse } from "@/lib/auth/types"
import { forwardCookies, safeParseJson } from "../_helpers"

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    if (!BACKEND_URL) {
      console.error("BACKEND_URL no está configurado")
      return NextResponse.json(
        { message: "Error de configuración del servidor" },
        { status: 500 }
      )
    }

    // Proxy al backend Spring Boot
    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/auth/autenticarse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor. Verifique que el backend esté activo." },
        { status: 503 }
      )
    }

    // Error del backend → reenviar mensaje tal cual
    if (!backendRes.ok) {
      const { message } = await safeParseJson(backendRes, "Error al autenticar")
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    // Login exitoso: el backend responde JSON + Set-Cookie (refresh_token)
    const data: BackendLoginResponse = await backendRes.json()

    const user = {
      idUsuario: data.idUsuario,
      nombre: data.nombre,
      apellido: data.apellido,
      rol: data.rol,
      idSucursal: data.idSucursal,
    }

    const response = NextResponse.json(
      { access_token: data.access_token, user },
      { status: 200 }
    )

    // Reenviar Set-Cookie del backend (refresh_token HttpOnly) al navegador
    forwardCookies(backendRes, response)

    // Guardar datos de usuario en cookie propia del BFF (para restaurar en refresh)
    response.cookies.set("session_user", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error("[LOGIN]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
