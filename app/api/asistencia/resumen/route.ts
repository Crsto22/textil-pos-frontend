import { NextRequest } from "next/server"
import { proxyAsistencia } from "@/app/api/asistencia/_proxy"

const QUERY = ["desde", "hasta", "idTrabajador", "idSucursal", "estado", "modalidad", "rotativo", "vista", "page", "q"] as const

export function GET(request: NextRequest) {
  return proxyAsistencia(request, "/api/asistencia/resumen", QUERY)
}
