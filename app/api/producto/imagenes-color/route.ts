import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

/**
 * GET /api/producto/imagenes-color?productoId=1&colorId=2
 * Proxies → GET /api/producto/imagenes_color?productoId=1&colorId=2  (backend confirmed)
 */
export async function GET(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            return NextResponse.json([], { status: 200 })
        }

        const { searchParams } = new URL(request.url)
        const productoId = searchParams.get("productoId")
        const colorId = searchParams.get("colorId")

        if (!productoId || !colorId) {
            return NextResponse.json({ message: "productoId y colorId son requeridos" }, { status: 400 })
        }

        const authHeader = request.headers.get("authorization")
        const headers: HeadersInit = {}
        if (authHeader) headers["Authorization"] = authHeader

        /* ── Confirmed backend endpoint: /api/producto/imagenes_color ── */
        const url = `${BACKEND_URL}/api/producto/imagenes_color?productoId=${encodeURIComponent(productoId)}&colorId=${encodeURIComponent(colorId)}`
        console.log(`[IMAGENES-COLOR] → ${url}`)

        let res: Response
        try {
            res = await fetch(url, { headers, cache: "no-store" })
        } catch {
            console.error("[IMAGENES-COLOR] Network error")
            return NextResponse.json([], { status: 200 })
        }

        console.log(`[IMAGENES-COLOR] ← ${res.status}`)

        if (res.ok) {
            const data = await res.json()
            return NextResponse.json(data, { status: 200 })
        }

        // Log non-ok response for debugging
        const errText = await res.text().catch(() => "")
        console.error(`[IMAGENES-COLOR] Error ${res.status}: ${errText}`)
        return NextResponse.json([], { status: 200 })
    } catch (error) {
        console.error("[IMAGENES-COLOR]", error)
        return NextResponse.json([], { status: 200 })
    }
}
