import { NextRequest, NextResponse } from "next/server"
import { forwardCookies } from "../_helpers"

const BACKEND_URL = process.env.BACKEND_URL

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie")

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

        // Limpiar cookie de usuario del BFF
        response.cookies.set("session_user", "", { path: "/", maxAge: 0 })

        return response
      } catch {
        // Si no se conecta al backend, limpiar cookies localmente
      }
    }

    // Fallback: limpiar cookies manualmente si el backend no responde
    const response = NextResponse.json({ ok: true }, { status: 200 })
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 0,
    })
    response.cookies.set("session_user", "", { path: "/", maxAge: 0 })
    return response
  } catch (error) {
    console.error("[LOGOUT]", error)
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
