import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!BACKEND_URL) {
            console.error("BACKEND_URL no esta configurado")
            return NextResponse.json(
                { message: "Error de configuracion del servidor" },
                { status: 500 }
            )
        }

        const { id } = await params
        const authHeader = request.headers.get("authorization")

        const headers: HeadersInit = {}
        if (authHeader) {
            headers["Authorization"] = authHeader
        }

        let backendRes: Response
        try {
            backendRes = await fetch(
                `${BACKEND_URL}/api/cliente/detalle/${encodeURIComponent(id)}`,
                {
                    method: "GET",
                    cache: "no-store",
                    headers,
                }
            )
        } catch {
            return NextResponse.json(
                { message: "No se pudo conectar al servidor. Verifique que el backend este activo." },
                { status: 503 }
            )
        }

        if (!backendRes.ok) {
            const text = await backendRes.text()
            let message = "Error al obtener detalle del cliente"
            try {
                const json = JSON.parse(text)
                message = json.message ?? json.error ?? message
            } catch {
                if (text) message = text
            }
            return NextResponse.json({ message }, { status: backendRes.status })
        }

        const data = await backendRes.json()
        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        console.error("[CLIENTE/DETALLE]", error)
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
