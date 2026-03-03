import { NextRequest, NextResponse } from "next/server"
import { forwardCookies } from "../_helpers"

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie")
    const clearSessionCookies = (response: NextResponse) => {
      response.cookies.set("refresh_token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/api/auth",
        maxAge: 0,
      })
      response.cookies.set("session_user", "", { path: "/", maxAge: 0 })
    }

    // Llamar al backend para invalidar el refresh_token
    if (BACKEND_URL && cookieHeader) {
      try {
        const backendRes = await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Cookie: cookieHeader },
        })

        const response = NextResponse.json({ ok: true }, { status: 200 })

        // Reenviar Set-Cookie del backend (borra refresh_token)
        forwardCookies(backendRes, response)

        // Limpieza defensiva local aunque el backend no devuelva Set-Cookie.
        clearSessionCookies(response)

        return response
      } catch {
        // Si no se conecta al backend, limpiar cookies localmente
      }
    }

    // Fallback: limpiar cookies manualmente si el backend no responde
    const response = NextResponse.json({ ok: true }, { status: 200 })
    clearSessionCookies(response)
    return response
  } catch (error) {
    console.error("[LOGOUT]", error)
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
