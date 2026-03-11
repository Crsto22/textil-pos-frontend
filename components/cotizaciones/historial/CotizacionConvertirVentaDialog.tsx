"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"

import PaymentMethod, { type PaymentKey } from "@/components/ventas/PaymentMethod"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useComprobanteOptions } from "@/lib/hooks/useComprobanteOptions"
import { useMetodosPagoActivos } from "@/lib/hooks/useMetodosPagoActivos"
import type {
  CotizacionConvertirVentaRequest,
  CotizacionConvertirVentaResponse,
  CotizacionHistorial,
} from "@/lib/types/cotizacion"
import { formatMonto } from "@/components/ventas/historial/historial.utils"

interface CotizacionConvertirVentaDialogProps {
  open: boolean
  target: CotizacionHistorial | null
  onOpenChange: (open: boolean) => void
  onConverted: (payload: CotizacionConvertirVentaResponse) => void
}

export function CotizacionConvertirVentaDialog({
  open,
  target,
  onOpenChange,
  onConverted,
}: CotizacionConvertirVentaDialogProps) {
  const router = useRouter()
  const [selectedPayment, setSelectedPayment] = useState<PaymentKey | null>(null)
  const [selectedComprobanteId, setSelectedComprobanteId] = useState("")
  const [reference, setReference] = useState("")
  const [requestError, setRequestError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { methods, loading, error: methodsError } = useMetodosPagoActivos({ enabled: open })
  const {
    comprobantes,
    comprobanteOptions,
    loadingComprobantes,
    errorComprobantes,
    searchComprobante,
    setSearchComprobante,
  } = useComprobanteOptions({
    enabled: open,
    idSucursal: target?.idSucursal ?? null,
  })

  useEffect(() => {
    if (!open) return
    setSelectedPayment(null)
    setSelectedComprobanteId("")
    setReference("")
    setRequestError(null)
  }, [open, target?.idCotizacion])

  const effectiveSelectedComprobanteId = useMemo(() => {
    if (!selectedComprobanteId) return ""
    return comprobanteOptions.some((option) => option.value === selectedComprobanteId)
      ? selectedComprobanteId
      : ""
  }, [comprobanteOptions, selectedComprobanteId])

  const selectedComprobante = useMemo(
    () =>
      comprobantes.find((item) => String(item.idComprobante) === effectiveSelectedComprobanteId) ?? null,
    [comprobantes, effectiveSelectedComprobanteId]
  )

  const selectedMetodoPago = useMemo(() => {
    if (!selectedPayment || !methods) return null
    return methods.find((method) => method.nombre === selectedPayment) ?? null
  }, [methods, selectedPayment])

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return
    onOpenChange(nextOpen)
  }

  const handleConvert = async () => {
    if (!target || submitting) return

    if (!selectedMetodoPago) {
      const message = "Selecciona un metodo de pago valido."
      setRequestError(message)
      toast.error(message)
      return
    }

    setSubmitting(true)
    setRequestError(null)

    const payload: CotizacionConvertirVentaRequest = {
      pagos: [
        {
          idMetodoPago: selectedMetodoPago.idMetodoPago,
          monto: Number(target.total.toFixed(2)),
          referencia: reference.trim() || selectedMetodoPago.nombre,
        },
      ],
    }

    if (selectedComprobante?.tipoComprobante) {
      payload.tipoComprobante = selectedComprobante.tipoComprobante
    }

    try {
      const response = await authFetch(`/api/cotizacion/${target.idCotizacion}/convertir-a-venta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          data &&
          typeof data === "object" &&
          "message" in data &&
          typeof data.message === "string"
            ? data.message
            : `Error ${response.status} al convertir la cotizacion`
        setRequestError(message)
        toast.error(message)
        return
      }

      const payloadResponse = data as CotizacionConvertirVentaResponse
      toast.success("Cotizacion convertida a venta.", {
        action: {
          label: "Ver venta",
          onClick: () => {
            router.push(`/ventas/historial?ventaId=${payloadResponse.idVenta}`)
          },
        },
      })
      onConverted(payloadResponse)
      onOpenChange(false)
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo convertir la cotizacion"
      setRequestError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>Convertir a venta</DialogTitle>
          <DialogDescription>
            Registra una venta real a partir de la cotizacion{" "}
            <span className="font-semibold text-foreground">
              {target ? `#${target.idCotizacion}` : ""}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 rounded-xl border bg-slate-50/60 p-4 md:grid-cols-3 dark:bg-slate-900/20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cliente
              </p>
              <p className="mt-1 text-sm font-medium">{target?.nombreCliente || "Sin cliente"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-sm font-medium">
                {target ? formatMonto(target.total) : formatMonto(0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sucursal
              </p>
              <p className="mt-1 text-sm font-medium">{target?.nombreSucursal || "Sin sucursal"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Comprobante</label>
            <Combobox
              id="convertir-venta-comprobante"
              value={effectiveSelectedComprobanteId}
              options={comprobanteOptions}
              searchValue={searchComprobante}
              onSearchValueChange={setSearchComprobante}
              onValueChange={setSelectedComprobanteId}
              placeholder="Usar por defecto del backend"
              searchPlaceholder="Buscar comprobante..."
              emptyMessage="No hay comprobantes activos para esta sucursal"
              loading={loadingComprobantes}
            />
            {errorComprobantes && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{errorComprobantes}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Metodo de pago</label>
            <PaymentMethod
              selected={selectedPayment}
              onSelect={setSelectedPayment}
              methods={loading ? undefined : methods}
            />
            {methodsError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{methodsError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="convertir-venta-referencia" className="text-sm font-medium text-foreground">
              Referencia
            </label>
            <input
              id="convertir-venta-referencia"
              type="text"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Opcional. Ej. Pago total"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>

          {requestError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
              {requestError}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={submitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConvert} disabled={submitting || !selectedMetodoPago}>
            {submitting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Convirtiendo...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Convertir a venta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
