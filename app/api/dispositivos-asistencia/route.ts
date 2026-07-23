import { NextRequest } from "next/server"
import { proxyAsistencia } from "@/app/api/asistencia/_proxy"

const QUERY = ["q", "idSucursal", "estado", "page"] as const

export function GET(request: NextRequest) {
  return proxyAsistencia(request, "/api/dispositivos-asistencia", QUERY)
}

export function POST(request: NextRequest) {
  return proxyAsistencia(request, "/api/dispositivos-asistencia")
}
