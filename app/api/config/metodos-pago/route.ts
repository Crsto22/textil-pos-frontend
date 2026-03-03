import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

/**
 * GET /api/config/metodos-pago
 * Proxies to backend config endpoint.
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
            res = await fetch(`${BACKEND_URL}/api/config/metodos-pago`, {
                headers,
                cache: "no-store",
            })
        } catch {
            return NextResponse.json(
                { message: "No se pudo conectar al backend." },
                { status: 503 }
            )
        }

        if (!res.ok) {
            const text = await res.text()
            let message = "Error al listar metodos de pago"
            try {
                const j = JSON.parse(text)
                message = j.message ?? message
            } catch {
                if (text) message = text
            }
            return NextResponse.json({ message }, { status: res.status })
        }

        const data = await res.json()
        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        console.error("[CONFIG/METODOS-PAGO]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}
