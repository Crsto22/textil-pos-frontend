"use client"

import { useEffect } from "react"

import { useVentaDetalle } from "@/lib/hooks/useVentaDetalle"

import { VentaDetalleContent } from "./VentaDetalleContent"

interface VentaDetallePageProps {
  ventaId: number
}

export function VentaDetallePage({ ventaId }: VentaDetallePageProps) {
  const {
    detalle,
    loading,
    error,
    openVentaDetalle,
    retryVentaDetalle,
    retrySunatVenta,
    anularVenta,
    retryingSunat,
    anulandoVenta,
  } = useVentaDetalle()

  useEffect(() => {
    void openVentaDetalle(ventaId)
  }, [openVentaDetalle, ventaId])

  return (
    <div className="w-full space-y-6">
      <VentaDetalleContent
        detalle={detalle}
        loading={loading}
        error={error}
        onRetry={() => {
          void retryVentaDetalle()
        }}
        onRetrySunat={retrySunatVenta}
        onAnularVenta={anularVenta}
        retryingSunat={retryingSunat}
        anulandoVenta={anulandoVenta}
      />
    </div>
  )
}
