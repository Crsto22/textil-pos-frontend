import { NextRequest } from "next/server"
import { proxyAsistencia } from "@/app/api/asistencia/_proxy"

interface Context { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Context) {
  const { id } = await params
  return proxyAsistencia(request, `/api/asistencia/cargos/${encodeURIComponent(id)}`)
}
