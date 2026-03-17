import { NextRequest } from "next/server"

import { proxyDocumentoLookup } from "@/app/api/documento/_helpers"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ dni: string }> }
) {
    const { dni } = await params

    return proxyDocumentoLookup(
        request,
        `/api/documento/dni/${encodeURIComponent(dni)}`,
        `No se pudo obtener informacion para el DNI ${dni}`,
        "[DOCUMENTO/DNI]"
    )
}
