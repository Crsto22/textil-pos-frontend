import { NextRequest } from "next/server"
import { proxyAsistencia } from "@/app/api/asistencia/_proxy"

export function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => proxyAsistencia(request, `/api/asistencia/marcaciones/${encodeURIComponent(id)}/anular`))
}
