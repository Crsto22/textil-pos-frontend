import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

async function parseResponseBody(res: Response): Promise<unknown> {
    const text = await res.text()
    try { return JSON.parse(text) } catch { return { message: text || "Error" } }
}

/**
 * DELETE /api/config/metodos-pago/eliminar/[id]
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
        console.error("[METODOS-PAGO DELETE/eliminar/:id]", error)
        return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
    }
}
