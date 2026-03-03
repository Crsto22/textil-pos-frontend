import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

type EstadoMetodoPago = "ACTIVO" | "INACTIVO"

function normalizeEstado(value: unknown): EstadoMetodoPago | null {
    if (typeof value !== "string") return null
    const normalized = value.trim().toUpperCase()
    if (normalized === "ACTIVO" || normalized === "INACTIVO") {
        return normalized
    }
    return null
}

/**
 * PATCH/PUT /api/config/metodos-pago/[id]/estado
 * Body: { estado: "ACTIVO" | "INACTIVO" }
 */
async function handleToggle(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
    method: "PATCH" | "PUT"
) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
        }

        const { id } = await params
        const parsedBody = await request.json().catch(() => null)
        const rawEstado = parsedBody?.estado ?? parsedBody?.activo

        if (typeof rawEstado !== "string" || rawEstado.trim().length === 0) {
            return NextResponse.json({ message: "Ingrese estado" }, { status: 400 })
        }

        const estado = normalizeEstado(rawEstado)
        if (!estado) {
            return NextResponse.json(
                { message: "Estado permitido: ACTIVO o INACTIVO" },
                { status: 400 }
            )
        }

        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = { "Content-Type": "application/json" }
        if (authHeader) headers["Authorization"] = authHeader

        let res: Response
        try {
            res = await fetch(`${BACKEND_URL}/api/config/metodos-pago/${id}/estado`, {
                method,
                headers,
                body: JSON.stringify({ estado }),
            })
        } catch {
            return NextResponse.json(
                { message: "No se pudo conectar al backend." },
                { status: 503 }
            )
        }

        const text = await res.text()
        let data: unknown
        try {
            data = JSON.parse(text)
        } catch {
            data = { message: text || (res.ok ? "OK" : "Error") }
        }

        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("[CONFIG/METODOS-PAGO/ESTADO]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return handleToggle(request, context, "PATCH")
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return handleToggle(request, context, "PUT")
}
