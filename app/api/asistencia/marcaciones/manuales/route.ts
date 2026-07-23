import { NextRequest } from "next/server"
import { proxyAsistencia } from "@/app/api/asistencia/_proxy"

export function POST(request: NextRequest) {
  return proxyAsistencia(request, "/api/asistencia/marcaciones/manuales")
}
