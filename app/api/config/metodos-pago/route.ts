import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

async function parseResponseBody(res: Response): Promise<unknown> {
    const text = await res.text()
    try { return JSON.parse(text) } catch { return { message: text || "Error" } }
}

/**
 * GET /api/config/metodos-pago
 * Query: ?estado=ACTIVO | INACTIVO (optional)
 */
export async function GET(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
        }

        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = {}
        if (authHeader) headers["Authorization"] = authHeader

        const estado = request.nextUrl.searchParams.get("estado")
        const backendUrl = new URL(`${BACKEND_URL}/api/config/metodos-pago`)
        if (estado) backendUrl.searchParams.set("estado", estado)

        let res: Response
        try {
            res = await fetch(backendUrl.toString(), { headers, cache: "no-store" })
        } catch {
            return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
        }

        const data = await parseResponseBody(res)
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("[METODOS-PAGO GET]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}

/**
 * POST /api/config/metodos-pago
 * Body: { nombre, estado?, descripcion?, cuentas?: [{ numeroCuenta }] }
 */
export async function POST(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
        }

        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = { "Content-Type": "application/json" }
        if (authHeader) headers["Authorization"] = authHeader

        const body = await request.json().catch(() => null)
        if (!body || typeof body.nombre !== "string" || !body.nombre.trim()) {
            return NextResponse.json({ message: "El campo nombre es requerido" }, { status: 400 })
        }

        let res: Response
        try {
            res = await fetch(`${BACKEND_URL}/api/config/metodos-pago`, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            })
        } catch {
            return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
        }

        const data = await parseResponseBody(res)
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("[METODOS-PAGO POST]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}
