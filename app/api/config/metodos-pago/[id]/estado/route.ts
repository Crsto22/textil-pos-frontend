import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

type EstadoMetodoPago = "ACTIVO" | "INACTIVO"

function normalizeEstado(value: unknown): EstadoMetodoPago | null {
    if (typeof value !== "string") return null
    const v = value.trim().toUpperCase()
    return v === "ACTIVO" || v === "INACTIVO" ? v : null
}

async function parseResponseBody(res: Response): Promise<unknown> {
    const text = await res.text()
    try { return JSON.parse(text) } catch { return { message: text || "Error" } }
}

/**
 * PATCH /api/config/metodos-pago/[id]/estado
 * Body: { estado: "ACTIVO" | "INACTIVO" }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
        }

        const { id } = await params
        const body = await request.json().catch(() => null)
        const estado = normalizeEstado(body?.estado)

        if (!estado) {
            return NextResponse.json(
                { message: "estado permitido: ACTIVO o INACTIVO" },
                { status: 400 }
            )
        }

        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = { "Content-Type": "application/json" }
        if (authHeader) headers["Authorization"] = authHeader

        let res: Response
        try {
            res = await fetch(`${BACKEND_URL}/api/config/metodos-pago/${id}/estado`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ estado }),
            })
        } catch {
            return NextResponse.json({ message: "No se pudo conectar al backend." }, { status: 503 })
        }

        const data = await parseResponseBody(res)
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("[METODOS-PAGO PATCH/:id/estado]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}
