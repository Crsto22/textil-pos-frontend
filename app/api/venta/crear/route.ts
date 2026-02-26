import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

/**
 * POST /api/venta/crear
 * Proxies → POST BACKEND_URL/api/venta/crear
 * Body: { idCliente, detalles: [{idProductoVariante, cantidad, precioUnitario}], pagos: [{metodoPago, monto}] }
 */
export async function POST(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
        }

        const body = await request.json()
        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = { "Content-Type": "application/json" }
        if (authHeader) headers["Authorization"] = authHeader

        let res: Response
        try {
            res = await fetch(`${BACKEND_URL}/api/venta/crear`, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            })
        } catch {
            return NextResponse.json(
                { message: "No se pudo conectar al backend. Verifique que esté activo." },
                { status: 503 }
            )
        }

        const text = await res.text()
        let data: unknown
        try { data = JSON.parse(text) } catch { data = { message: text || "Error desconocido" } }

        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("[VENTA/CREAR]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}
