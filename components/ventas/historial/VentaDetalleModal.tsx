"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type {
  VentaAnularRequest,
  VentaAnularResult,
  VentaDetalleResponse,
} from "@/lib/types/venta"

import { VentaDetalleContent } from "./VentaDetalleContent"

interface VentaDetalleModalProps {
  open: boolean
  detalle: VentaDetalleResponse | null
  loading: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onRetry: () => void
  onRetrySunat: () => Promise<{ ok: boolean; message: string }>
  onAnularVenta: (payload: VentaAnularRequest) => Promise<VentaAnularResult>
  retryingSunat: boolean
  anulandoVenta: boolean
}

export function VentaDetalleModal({
  open,
  detalle,
  loading,
  error,
  onOpenChange,
  onRetry,
  onRetrySunat,
  onAnularVenta,
  retryingSunat,
  anulandoVenta,
}: VentaDetalleModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[96dvh] flex-col gap-0 p-0">
        <SheetHeader className="shrink-0 border-b px-4 py-4 sm:px-6">
          <SheetTitle className="text-sm sm:text-lg">Detalle de Venta</SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            Comprobante, items y pagos de la venta seleccionada.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <VentaDetalleContent
            detalle={detalle}
            loading={loading}
            error={error}
            onRetry={onRetry}
            onRetrySunat={onRetrySunat}
            onAnularVenta={onAnularVenta}
            retryingSunat={retryingSunat}
            anulandoVenta={anulandoVenta}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
