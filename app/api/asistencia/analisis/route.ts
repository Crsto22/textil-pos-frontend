import { NextRequest } from "next/server"
import { proxyAsistencia } from "@/app/api/asistencia/_proxy"

const QUERY = ["desde", "hasta", "idTrabajador", "idSucursal", "page"] as const

export function GET(request: NextRequest) {
  return proxyAsistencia(request, "/api/asistencia/analisis", QUERY)
}
