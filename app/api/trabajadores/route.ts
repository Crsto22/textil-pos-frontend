import { NextRequest } from "next/server"
import { proxyAsistencia } from "@/app/api/asistencia/_proxy"

const QUERY = ["q", "idSucursal", "estado", "modalidad", "rotativo", "page"] as const

export function GET(request: NextRequest) {
  return proxyAsistencia(request, "/api/trabajadores", QUERY)
}

export function POST(request: NextRequest) {
  return proxyAsistencia(request, "/api/trabajadores")
}
