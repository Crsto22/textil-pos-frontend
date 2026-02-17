import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function GET(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            console.error("BACKEND_URL no está configurado")
            return NextResponse.json(
                { message: "Error de configuración del servidor" },
                { status: 500 }
            )
        }

        // Leer parámetro de paginación
        const { searchParams } = new URL(request.url)
        const page = searchParams.get("page") ?? "0"

        // Reenviar Authorization del cliente al backend
        const authHeader = request.headers.get("authorization")

        const headers: HeadersInit = {}
        if (authHeader) {
            headers["Authorization"] = authHeader
        }

        let backendRes: Response
        try {
            backendRes = await fetch(
                `${BACKEND_URL}/api/cliente/listar?page=${encodeURIComponent(page)}`,
                { headers }
            )
        } catch {
            return NextResponse.json(
                { message: "No se pudo conectar al servidor. Verifique que el backend esté activo." },
                { status: 503 }
            )
        }

        if (!backendRes.ok) {
            const text = await backendRes.text()
            let message = "Error al obtener clientes"
            try {
                const json = JSON.parse(text)
                message = json.message ?? message
            } catch {
                if (text) message = text
            }
            return NextResponse.json({ message }, { status: backendRes.status })
        }

        const data = await backendRes.json()
        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        console.error("[CLIENTE/LISTAR]", error)
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
