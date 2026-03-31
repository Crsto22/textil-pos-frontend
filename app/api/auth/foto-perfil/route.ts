import { NextRequest, NextResponse } from "next/server"
import type { AuthUser } from "@/lib/auth/types"
import { safeParseJson, setSessionUserCookie } from "../_helpers"

const BACKEND_URL = process.env.BACKEND_URL

export async function PUT(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { message: "Debe enviar una imagen" },
        { status: 400 }
      )
    }

    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { message: "Debe enviar una imagen" },
        { status: 400 }
      )
    }

    const backendFormData = new FormData()
    backendFormData.append("file", file, file.name)

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/auth/foto-perfil`, {
        method: "PUT",
        headers: {
          Authorization: authHeader,
        },
        body: backendFormData,
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
        "Error al actualizar foto de perfil"
      )
      const status = backendRes.status >= 400 ? backendRes.status : 400
      return NextResponse.json({ message }, { status })
    }

    const user = (await backendRes.json()) as AuthUser
    const response = NextResponse.json(user, { status: 200 })
    setSessionUserCookie(response, user)

    return response
  } catch (error) {
    console.error("[AUTH/FOTO-PERFIL]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/auth/foto-perfil`, {
        method: "DELETE",
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
        "Error al eliminar foto de perfil"
      )
      const status = backendRes.status >= 400 ? backendRes.status : 400
      return NextResponse.json({ message }, { status })
    }

    const user = (await backendRes.json()) as AuthUser
    const response = NextResponse.json(user, { status: 200 })
    setSessionUserCookie(response, user)

    return response
  } catch (error) {
    console.error("[AUTH/FOTO-PERFIL/DELETE]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
