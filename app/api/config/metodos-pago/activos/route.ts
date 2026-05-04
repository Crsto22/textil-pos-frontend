import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

/**
 * GET /api/config/metodos-pago/activos
 * Alias: proxies to GET /api/config/metodos-pago?estado=ACTIVO
 */
export async function GET(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
        }

        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = {}
        if (authHeader) headers["Authorization"] = authHeader

        let res: Response
        try {
            res = await fetch(`${BACKEND_URL}/api/config/metodos-pago?estado=ACTIVO`, {
                headers,
                cache: "no-store",
            })
        } catch {
            return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
        }

        const text = await res.text()
        let data: unknown
        try { data = JSON.parse(text) } catch { data = { message: text || "Error" } }

        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("[METODOS-PAGO/ACTIVOS GET]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}
