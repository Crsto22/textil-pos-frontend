import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

async function parseResponseBody(res: Response): Promise<unknown> {
    const text = await res.text()
    try { return JSON.parse(text) } catch { return { message: text || "Error" } }
}

/**
 * GET /api/config/metodos-pago/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
        }

        const { id } = await params
        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = {}
        if (authHeader) headers["Authorization"] = authHeader

        let res: Response
        try {
            res = await fetch(`${BACKEND_URL}/api/config/metodos-pago/${id}`, {
                headers,
                cache: "no-store",
            })
        } catch {
            return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
        }

        const data = await parseResponseBody(res)
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("[METODOS-PAGO GET/:id]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}

/**
 * PUT /api/config/metodos-pago/[id]
 * Body: { nombre, estado, descripcion?, cuentas?: [{ numeroCuenta }] }
 * Replaces everything — cuentas[] vacío limpia las cuentas.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
        }

        const { id } = await params
        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = { "Content-Type": "application/json" }
        if (authHeader) headers["Authorization"] = authHeader

        const body = await request.json().catch(() => null)
        if (!body || typeof body.nombre !== "string" || !body.nombre.trim()) {
            return NextResponse.json({ message: "El campo nombre es requerido" }, { status: 400 })
        }

        let res: Response
        try {
            res = await fetch(`${BACKEND_URL}/api/config/metodos-pago/${id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(body),
            })
        } catch {
            return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
        }

        const data = await parseResponseBody(res)
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("[METODOS-PAGO PUT/:id]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}

/**
 * DELETE /api/config/metodos-pago/[id]
 * Alias para /api/config/metodos-pago/eliminar/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
        }

        const { id } = await params
        if (!id?.trim()) {
            return NextResponse.json({ message: "ID invalido" }, { status: 400 })
        }

        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = {}
        if (authHeader) headers["Authorization"] = authHeader

        let res: Response
        try {
            res = await fetch(`${BACKEND_URL}/api/config/metodos-pago/eliminar/${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers,
            })
        } catch {
            return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
        }

        const data = await parseResponseBody(res)
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("[METODOS-PAGO DELETE/:id]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}
