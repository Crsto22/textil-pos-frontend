"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[96vh] w-[96vw] overflow-y-auto p-0 sm:max-w-[1200px]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Detalle de Venta</DialogTitle>
          <DialogDescription>
            Comprobante, items y pagos de la venta seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
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
      </DialogContent>
    </Dialog>
  )
}
