import { NextResponse } from "next/server"
import { normalizeAssetUrlField } from "@/lib/server/public-asset-url"

const BACKEND_URL = process.env.BACKEND_URL

export async function GET() {
  try {
    if (!BACKEND_URL) {
      console.error("BACKEND_URL no esta configurado")
      return NextResponse.json(
        { message: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    let backendRes: Response
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/empresa/publico`, {
        cache: "no-store",
      })
    } catch {
      return NextResponse.json(
        {
          message:
            "No se pudo conectar al servidor. Verifique que el backend este activo.",
        },
        { status: 503 }
      )
    }

    if (!backendRes.ok) {
      let message = "Error al obtener datos publicos de la empresa"
      try {
        const errorData = await backendRes.json()
        message = errorData.message ?? message
      } catch {
        // respuesta sin JSON valido
      }
      return NextResponse.json({ message }, { status: backendRes.status })
    }

    const data = await backendRes.json()
    return NextResponse.json(normalizeAssetUrlField(data, "logoUrl"), { status: 200 })
  } catch (error) {
    console.error("[EMPRESA/PUBLICO]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
