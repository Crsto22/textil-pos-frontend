"use client"

import { useEffect } from "react"

import { useNotaCreditoDetalle } from "@/lib/hooks/useNotaCreditoDetalle"

import { NotaCreditoDetalleContent } from "./NotaCreditoDetalleContent"

interface NotaCreditoDetallePageProps {
  notaCreditoId: number
}

export function NotaCreditoDetallePage({ notaCreditoId }: NotaCreditoDetallePageProps) {
  const {
    detalle,
    loading,
    error,
    openNotaCreditoDetalle,
    retryNotaCreditoDetalle,
  } = useNotaCreditoDetalle()

  useEffect(() => {
    void openNotaCreditoDetalle(notaCreditoId)
  }, [notaCreditoId, openNotaCreditoDetalle])

  return (
    <div className="w-full space-y-6">
      <NotaCreditoDetalleContent
        detalle={detalle}
        loading={loading}
        error={error}
        onRetry={() => {
          void retryNotaCreditoDetalle()
        }}
      />
    </div>
  )
}
