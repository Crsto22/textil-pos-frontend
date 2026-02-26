import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

/**
 * GET /api/producto/variantes?productoId=1
 * Proxies: GET /api/variante/producto/{id}  (backend confirmed)
 */
export async function GET(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ message: "Error de configuracion del servidor" }, { status: 500 })
        }

        const { searchParams } = new URL(request.url)
        const productoId = searchParams.get("productoId")
        if (!productoId) {
            return NextResponse.json({ message: "productoId es requerido" }, { status: 400 })
        }

        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = { "Content-Type": "application/json" }
        if (authHeader) headers["Authorization"] = authHeader

        const url = `${BACKEND_URL}/api/variante/producto/${encodeURIComponent(productoId)}`
        console.log(`[VARIANTES] → ${url}`)

        let backendRes: Response
        try {
            backendRes = await fetch(url, { headers })
        } catch {
            return NextResponse.json(
                { message: "No se pudo conectar al servidor. Verifique que el backend este activo." },
                { status: 503 }
            )
        }

        if (!backendRes.ok) {
            const text = await backendRes.text()
            let message = "Error al obtener variantes del producto"
            try { message = JSON.parse(text).message ?? message } catch { if (text) message = text }
            console.error(`[VARIANTES] Error ${backendRes.status}: ${message}`)
            return NextResponse.json({ message }, { status: backendRes.status })
        }

        const data = await backendRes.json()
        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        console.error("[PRODUCTO/VARIANTES]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}
