"use client"

import { useState } from "react"

import { OfertaBuilderSection } from "@/components/productos/ofertas/OfertaBuilderSection"

export function ProductosOfertasPage() {
  const [refreshToken, setRefreshToken] = useState(0)

  return (
    <div className="space-y-6">
      <OfertaBuilderSection
        refreshToken={refreshToken}
        onOfferSaved={() => {
          setRefreshToken((previous) => previous + 1)
        }}
      />
    </div>
  )
}
