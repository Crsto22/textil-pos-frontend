import { NextRequest, NextResponse } from "next/server"
import { safeParseJson } from "../_helpers"
import type { AuthUser } from "@/lib/auth/types"

const BACKEND_URL = process.env.BACKEND_URL

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuración del servidor" },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: authHeader,
        },
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor." },
        { status: 503 }
      )
    }

    if (!backendRes.ok) {
      const { message } = await safeParseJson(
        backendRes,
        "Error al obtener usuario autenticado"
      )
      const status = backendRes.status >= 400 ? backendRes.status : 400
      return NextResponse.json({ message }, { status })
    }

    const user: AuthUser = await backendRes.json()
    const response = NextResponse.json(user, { status: 200 })

    // Mantener session_user sincronizada con el dato vivo de DB.
    response.cookies.set("session_user", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error("[ME]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
