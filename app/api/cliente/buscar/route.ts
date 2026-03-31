import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const ALLOWED_QUERY_KEYS = ["q", "page", "tipoDocumento"] as const
const ALLOWED_TIPO_DOCUMENTO = new Set(["DNI", "RUC", "CE", "SIN_DOC"])

function buildForwardQuery(request: NextRequest): string {
    const incomingSearchParams = new URL(request.url).searchParams
    const outgoingSearchParams = new URLSearchParams()

    ALLOWED_QUERY_KEYS.forEach((key) => {
        const value = incomingSearchParams.get(key)
        if (value !== null && value !== "") {
            outgoingSearchParams.set(key, value)
        }
    })

    if (!outgoingSearchParams.has("q")) {
        outgoingSearchParams.set("q", "")
    }

    if (!outgoingSearchParams.has("page")) {
        outgoingSearchParams.set("page", "0")
    }

    const tipoDocumento = outgoingSearchParams.get("tipoDocumento")
    if (tipoDocumento && !ALLOWED_TIPO_DOCUMENTO.has(tipoDocumento)) {
        throw new Error("INVALID_TIPO_DOCUMENTO")
    }

    const queryString = outgoingSearchParams.toString()
    return queryString ? `?${queryString}` : ""
}

export async function GET(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            console.error("BACKEND_URL no estÃ¡ configurado")
            return NextResponse.json(
                { message: "Error de configuraciÃ³n del servidor" },
                { status: 500 }
            )
        }

        let queryString = ""
        try {
            queryString = buildForwardQuery(request)
        } catch {
            return NextResponse.json(
                {
                    message:
                        "tipoDocumento inválido. Valores permitidos: DNI, RUC, CE, SIN_DOC",
                },
                { status: 400 }
            )
        }

        const authHeader = request.headers.get("authorization")

        const headers: HeadersInit = {}
        if (authHeader) {
            headers["Authorization"] = authHeader
        }

        let backendRes: Response
        try {
            backendRes = await fetch(
                `${BACKEND_URL}/api/cliente/buscar${queryString}`,
                { headers }
            )
        } catch {
            return NextResponse.json(
                { message: "No se pudo conectar al servidor. Verifique que el backend estÃ© activo." },
                { status: 503 }
            )
        }

        if (!backendRes.ok) {
            const text = await backendRes.text()
            let message = "Error al buscar clientes"
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
        console.error("[CLIENTES/BUSCAR]", error)
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
