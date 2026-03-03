import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

function buildTargetUrl(rawSrc: string, request: NextRequest): URL | null {
  const src = rawSrc.trim()
  if (!src) return null

  try {
    if (src.startsWith("/")) {
      if (!BACKEND_URL) return null
      return new URL(src, BACKEND_URL)
    }

    const target = new URL(src)
    if (!["http:", "https:"].includes(target.protocol)) return null

    if (!BACKEND_URL) return target

    const backendHost = new URL(BACKEND_URL).host
    const frontendHost = request.nextUrl.host
    if (target.host !== backendHost && target.host !== frontendHost) {
      return null
    }

    return target
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const src = request.nextUrl.searchParams.get("src") ?? ""
    const targetUrl = buildTargetUrl(src, request)

    if (!targetUrl) {
      return NextResponse.json(
        { message: "URL de logo invalida o no permitida" },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get("authorization")
    const headers: HeadersInit = {
      Accept: "image/*,*/*;q=0.8",
    }
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    let upstreamResponse: Response
    try {
      upstreamResponse = await fetch(targetUrl.toString(), {
        method: "GET",
        headers,
        cache: "no-store",
      })
    } catch {
      return NextResponse.json(
        { message: "No se pudo obtener el logo de empresa" },
        { status: 503 }
      )
    }

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { message: "No se pudo obtener el logo de empresa" },
        { status: upstreamResponse.status }
      )
    }

    const contentType = upstreamResponse.headers.get("content-type") ?? "image/png"
    const arrayBuffer = await upstreamResponse.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[EMPRESA/LOGO-PROXY]", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

