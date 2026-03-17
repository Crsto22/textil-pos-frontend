import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

async function parseErrorResponse(response: Response, fallbackMessage: string) {
    const text = await response.text()

    try {
        const payload = JSON.parse(text) as { message?: string; error?: string }
        const message =
            payload.message?.trim() || payload.error?.trim() || fallbackMessage

        return { message }
    } catch {
        return { message: text || fallbackMessage }
    }
}

async function parseSuccessResponse(response: Response) {
    const text = await response.text()

    try {
        return JSON.parse(text)
    } catch {
        return {}
    }
}

export async function proxyDocumentoLookup(
    request: NextRequest,
    endpoint: string,
    fallbackErrorMessage: string,
    logContext: string
) {
    try {
        if (!BACKEND_URL) {
            console.error("BACKEND_URL no esta configurado")
            return NextResponse.json(
                { message: "Error de configuracion del servidor" },
                { status: 500 }
            )
        }

        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = {}

        if (authHeader) {
            headers.Authorization = authHeader
        }

        let backendResponse: Response
        try {
            backendResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: "GET",
                headers,
                cache: "no-store",
            })
        } catch {
            return NextResponse.json(
                {
                    message:
                        "No se pudo conectar al servidor. Verifique que el backend este activo.",
                },
                { status: 503 }
            )
        }

        if (!backendResponse.ok) {
            const payload = await parseErrorResponse(
                backendResponse,
                fallbackErrorMessage
            )
            return NextResponse.json(payload, {
                status: backendResponse.status,
            })
        }

        const payload = await parseSuccessResponse(backendResponse)
        return NextResponse.json(payload, { status: backendResponse.status || 200 })
    } catch (error) {
        console.error(logContext, error)
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
