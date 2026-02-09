import { NextRequest, NextResponse } from "next/server"
import { forwardCookies, safeParseJson } from "../_helpers"
import type { AuthUser } from "@/lib/auth/types"

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    // El navegador envía la cookie refresh_token automáticamente.
    // La reenviamos al backend tal cual.
    const cookieHeader = request.headers.get("cookie")

    if (!cookieHeader?.includes("refresh_token")) {
      return NextResponse.json(
        { message: "No hay sesión activa" },
        { status: 401 }
      )
    }

    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuración del servidor" },
        { status: 500 }
      )
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          Cookie: cookieHeader,
        },
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor." },
        { status: 503 }
      )
    }

    // Si el refresh falla, reenviar error + Set-Cookie del backend (que borra la cookie)
    if (!backendRes.ok) {
      const { message } = await safeParseJson(backendRes, "Sesión expirada")
      const response = NextResponse.json({ message }, { status: 401 })
      forwardCookies(backendRes, response)
      // Limpiar también la cookie de usuario del BFF
      response.cookies.set("session_user", "", { path: "/", maxAge: 0 })
      return response
    }

    // Refresh exitoso
    const data = await backendRes.json()

    // Recuperar datos de usuario de la cookie session_user del BFF
    let user: AuthUser | null = null
    const sessionUserCookie = request.cookies.get("session_user")?.value
    if (sessionUserCookie) {
      try {
        user = JSON.parse(sessionUserCookie)
      } catch { /* cookie corrupta, ignorar */ }
    }

    const response = NextResponse.json(
      { access_token: data.access_token, user },
      { status: 200 }
    )

    // Reenviar Set-Cookie del backend (refresh_token rotado)
    forwardCookies(backendRes, response)

    return response
  } catch (error) {
    console.error("[REFRESH]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
