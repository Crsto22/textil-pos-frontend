import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!BACKEND_URL) {
            console.error("BACKEND_URL no está configurado")
            return NextResponse.json(
                { message: "Error de configuración del servidor" },
                { status: 500 }
            )
        }

        const { id } = await params

        const authHeader = request.headers.get("authorization")

        // Read the incoming multipart body as-is and forward it directly.
        // We must NOT set Content-Type manually — the browser FormData boundary
        // is already embedded in the incoming Content-Type header.
        const contentType = request.headers.get("content-type") ?? ""

        const headers: HeadersInit = {
            "Content-Type": contentType,
        }
        if (authHeader) {
            headers["Authorization"] = authHeader
        }

        let backendRes: Response
        try {
            backendRes = await fetch(
                `${BACKEND_URL}/api/empresa/${encodeURIComponent(id)}/logo`,
                {
                    method: "PUT",
                    headers,
                    // Pipe the raw request body straight through
                    body: request.body,
                    // Required to stream the request body in Node.js-based Next.js
                    // @ts-expect-error — duplex is a valid Fetch option in Node 18+
                    duplex: "half",
                }
            )
        } catch {
            return NextResponse.json(
                { message: "No se pudo conectar al servidor. Verifique que el backend esté activo." },
                { status: 503 }
            )
        }

        if (!backendRes.ok) {
            let message = "Error al subir el logo"
            try {
                const errorData = await backendRes.json()
                message = errorData.message ?? message
            } catch {
                // respuesta sin JSON válido
            }
            return NextResponse.json({ message }, { status: backendRes.status })
        }

        const data = await backendRes.json()
        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        console.error("[EMPRESA/LOGO]", error)
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
