import { NextRequest, NextResponse } from "next/server"
import { forwardCookies, safeParseJson, setSessionUserCookie } from "../_helpers"
import type { AuthUser } from "@/lib/auth/types"
import { normalizeAssetUrlField } from "@/lib/server/public-asset-url"

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

    // Refresh exitoso. Consultar el usuario permite abrir este frontend usando
    // una sesion iniciada previamente en otro subdominio de Kiments.
    const data = await backendRes.json()
    let meRes: Response
    try {
      meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        method: "GET",
        cache: "no-store",
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo conectar al servidor." },
        { status: 503 }
      )
    }

    if (!meRes.ok) {
      const { message } = await safeParseJson(
        meRes,
        "Error al obtener usuario autenticado"
      )
      const response = NextResponse.json(
        { message },
        { status: meRes.status >= 400 ? meRes.status : 400 }
      )
      forwardCookies(backendRes, response)
      return response
    }

    const user = normalizeAssetUrlField(
      (await meRes.json()) as AuthUser,
      "fotoPerfilUrl"
    ) as AuthUser

    const response = NextResponse.json(
      { access_token: data.access_token, user },
      { status: 200 }
    )

    // Reenviar la cookie compartida y mantener el cache local de usuario.
    forwardCookies(backendRes, response)
    setSessionUserCookie(response, user)

    return response
  } catch (error) {
    console.error("[REFRESH]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
