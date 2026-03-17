import { NextRequest } from "next/server"

import { proxyDocumentoLookup } from "@/app/api/documento/_helpers"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ruc: string }> }
) {
    const { ruc } = await params

    return proxyDocumentoLookup(
        request,
        `/api/documento/ruc/${encodeURIComponent(ruc)}`,
        `No se pudo obtener informacion para el RUC ${ruc}`,
        "[DOCUMENTO/RUC]"
    )
}
