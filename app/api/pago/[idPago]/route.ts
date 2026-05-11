import { NextRequest, NextResponse } from "next/server"

import { forwardPagoUpdate } from "../_helpers"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ idPago: string }> }
) {
  try {
    const { idPago } = await params
    return forwardPagoUpdate(request, idPago, "")
  } catch (error) {
    console.error("[PAGO/ACTUALIZAR]", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
