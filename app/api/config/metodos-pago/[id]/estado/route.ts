import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

/**
 * PATCH/PUT /api/config/metodos-pago/[id]/estado
 * Body: { activo: "ACTIVO" | "INACTIVO" }
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
        const body = await request.json()
        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = { "Content-Type": "application/json" }
        if (authHeader) headers["Authorization"] = authHeader

        /* Try the requested method first, then fall back to the other */
        const methods = method === "PATCH" ? ["PATCH", "PUT"] : ["PUT", "PATCH"]

        for (const m of methods) {
            try {
                const res = await fetch(`${BACKEND_URL}/api/config/metodos-pago/${id}/estado`, {
                    method: m,
                    headers,
                    body: JSON.stringify(body),
                })

                /* If we get 403/405 on first method, try the other */
                if ((res.status === 403 || res.status === 405) && m === methods[0]) {
                    continue
                }

                const text = await res.text()
                let data: unknown
                try { data = JSON.parse(text) } catch { data = { message: text || (res.ok ? "OK" : "Error") } }
                return NextResponse.json(data, { status: res.status })
            } catch {
                if (m === methods[0]) continue
                return NextResponse.json(
                    { message: "No se pudo conectar al backend." },
                    { status: 503 }
                )
            }
        }

        return NextResponse.json({ message: "Error al conectar al backend" }, { status: 503 })
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
