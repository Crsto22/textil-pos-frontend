import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL
const CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const QUERY = ["desde", "hasta", "idTrabajador", "idSucursal", "estado", "modalidad", "rotativo", "q"] as const

export async function GET(request: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL no configurado" }, { status: 500 })
  }

  const params = new URLSearchParams()
  for (const key of QUERY) {
    const value = request.nextUrl.searchParams.get(key)
    if (value) params.set(key, value)
  }

  try {
    const authorization = request.headers.get("authorization")
    const response = await fetch(`${BACKEND_URL}/api/asistencia/resumen/reporte/excel?${params}`, {
      headers: authorization ? { Authorization: authorization } : undefined,
      cache: "no-store",
    })
    if (!response.ok) {
      const message = await response.text()
      try {
        return NextResponse.json(JSON.parse(message), { status: response.status })
      } catch {
        return NextResponse.json({ message: message || "No se pudo generar el reporte" }, { status: response.status })
      }
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? CONTENT_TYPE,
        "Content-Disposition": response.headers.get("content-disposition") ?? "attachment; filename=asistencia.xlsx",
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json({ message: "No se pudo conectar al backend" }, { status: 503 })
  }
}
