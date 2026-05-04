"use client"

import { Suspense } from "react"

import { GuiaConductoresVehiculosPage } from "@/components/ventas/guia-remision/conductores/GuiaConductoresVehiculosPage"

export default function ConductoresRoute() {
  return (
    <Suspense>
      <GuiaConductoresVehiculosPage />
    </Suspense>
  )
}
