"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowPathIcon, CheckCircleIcon, PencilSquareIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { ClienteEditDialog } from "@/components/clientes/modals/ClienteEditDialog"
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useComprobanteOptions } from "@/lib/hooks/useComprobanteOptions"
import { useClienteDetalle } from "@/lib/hooks/useClienteDetalle"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import { useMetodosPagoActivos } from "@/lib/hooks/useMetodosPagoActivos"
import type { ClienteUpdateRequest } from "@/lib/types/cliente"
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
  onClientUpdated?: () => Promise<void> | void
}

function sanitizeNumericInput(value: string) {
  return value.replace(/\D+/g, "")
}

function normalizeDateTimeLocal(value: string) {
  const trimmedValue = value.trim()
  if (!trimmedValue) return null
  return trimmedValue.length === 16 ? `${trimmedValue}:00` : trimmedValue
}

export function CotizacionConvertirVentaDialog({
  open,
  target,
  onOpenChange,
  onConverted,
  onClientUpdated,
}: CotizacionConvertirVentaDialogProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [selectedPayment, setSelectedPayment] = useState<PaymentKey | null>(null)
  const [selectedComprobanteId, setSelectedComprobanteId] = useState("")
  const [operationCode, setOperationCode] = useState("")
  const [operationDateTime, setOperationDateTime] = useState("")
  const [operationDateTimeError, setOperationDateTimeError] = useState("")
  const [requestError, setRequestError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [clientEditOpen, setClientEditOpen] = useState(false)

  const { methods, loading, error: methodsError } = useMetodosPagoActivos({ enabled: open })
  const {
    clienteId: loadedClienteId,
    detalle: clienteDetalle,
    loading: loadingClienteDetalle,
    error: clienteDetalleError,
    openClienteDetalle,
    closeClienteDetalle,
  } = useClienteDetalle()
  const {
    comprobantes,
    comprobanteOptions,
    loadingComprobantes,
    errorComprobantes,
    searchComprobante,
    setSearchComprobante,
  } = useComprobanteOptions({
    enabled: open,
    habilitadoVenta: true,
  })

  const targetClienteId =
    typeof target?.idCliente === "number" && target.idCliente > 0
      ? target.idCliente
      : null
  const clienteDetalleTarget =
    targetClienteId !== null &&
    loadedClienteId === targetClienteId &&
    clienteDetalle?.idCliente === targetClienteId
      ? clienteDetalle
      : null

  useEffect(() => {
    if (!open) return
    setSelectedPayment(null)
    setOperationCode("")
    setOperationDateTime("")
    setOperationDateTimeError("")
    setRequestError(null)
    setClientEditOpen(false)
  }, [open, target?.idCotizacion])

  useEffect(() => {
    if (!open || targetClienteId === null) return
    void openClienteDetalle(targetClienteId)
  }, [open, openClienteDetalle, targetClienteId])

  useEffect(() => {
    if (!open) return
    if (selectedComprobanteId) return
    if (comprobanteOptions.length === 0) return
    setSelectedComprobanteId(comprobanteOptions[0].value)
  }, [open, comprobanteOptions, selectedComprobanteId])

  const effectiveSelectedComprobanteId = useMemo(() => {
    if (!selectedComprobanteId) return ""
    if (comprobanteOptions.length === 0) return ""
    return comprobanteOptions.some((option) => option.value === selectedComprobanteId)
      ? selectedComprobanteId
      : comprobanteOptions[0].value
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
  const hasValidOperationCode = /^\d+$/.test(operationCode.trim())
  const selectedTipoComprobante = selectedComprobante?.tipoComprobante.trim().toUpperCase() ?? ""
  const isFacturaSelected = selectedTipoComprobante === "FACTURA"
  const clienteHasRuc =
    clienteDetalleTarget?.tipoDocumento.trim().toUpperCase() === "RUC"
  const facturaClientMessage =
    isFacturaSelected && targetClienteId === null
      ? "Para emitir factura, selecciona una cotizacion con cliente registrado."
      : isFacturaSelected && loadingClienteDetalle
        ? "Validando datos del cliente para emitir factura..."
        : isFacturaSelected && !clienteHasRuc
          ? "Para emitir factura, el cliente debe tener RUC. Edita el cliente antes de convertir."
          : null
  const canConvert =
    !submitting &&
    Boolean(selectedMetodoPago) &&
    hasValidOperationCode &&
    !facturaClientMessage

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return
    if (!nextOpen) {
      setClientEditOpen(false)
      closeClienteDetalle()
    }
    onOpenChange(nextOpen)
  }

  const handleUpdateClient = async (id: number, payload: ClienteUpdateRequest) => {
    try {
      const response = await authFetch(`/api/cliente/actualizar/${id}`, {
        method: "PUT",
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
            : "No se pudo actualizar el cliente"
        toast.error(message)
        return false
      }

      toast.success(
        data &&
          typeof data === "object" &&
          "message" in data &&
          typeof data.message === "string"
          ? data.message
          : "Cliente actualizado exitosamente"
      )

      await openClienteDetalle(id)
      await onClientUpdated?.()
      setRequestError(null)
      return true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el cliente"
      toast.error(message)
      return false
    }
  }

  const handleConvert = async () => {
    if (!target || submitting) return

    if (!selectedMetodoPago) {
      const message = "Selecciona un metodo de pago valido."
      setRequestError(message)
      toast.error(message)
      return
    }

    if (!operationCode.trim()) {
      const message = "Ingresa el codigo de operacion."
      setRequestError(message)
      toast.error(message)
      return
    }

    if (!hasValidOperationCode) {
      const message = "El codigo de operacion debe contener solo numeros."
      setRequestError(message)
      toast.error(message)
      return
    }

    if (facturaClientMessage) {
      setRequestError(facturaClientMessage)
      toast.error(facturaClientMessage)
      return
    }

    const normalizedOperationDateTime = normalizeDateTimeLocal(operationDateTime)
    if (!normalizedOperationDateTime) {
      const message = "Ingresa la fecha y hora de la operacion."
      setOperationDateTimeError(message)
      setRequestError(message)
      toast.error(message)
      return
    }

    setSubmitting(true)
    setRequestError(null)

    if (!selectedComprobante) {
      const message = "Selecciona un tipo de comprobante."
      setRequestError(message)
      toast.error(message)
      setSubmitting(false)
      return
    }

    const payload: CotizacionConvertirVentaRequest = {
      tipoComprobante: selectedComprobante.tipoComprobante,
      serie: selectedComprobante.serie,
      pagos: [
        {
          idMetodoPago: selectedMetodoPago.idMetodoPago,
          monto: Number(target.total.toFixed(2)),
          codigoOperacion: operationCode.trim(),
          fecha: normalizedOperationDateTime,
        },
      ],
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
      const sunatEstado = payloadResponse.venta?.sunatEstado ?? payloadResponse.sunatEstado ?? null
      const sunatAutoDispatchError = payloadResponse.sunatAutoDispatchError ?? null

      toast.success(
        sunatAutoDispatchError
          ? "Cotizacion convertida. SUNAT requiere revision manual."
          : sunatEstado
            ? `Cotizacion convertida a venta - SUNAT ${sunatEstado}`
            : payloadResponse.message || "Cotizacion convertida a venta.",
        {
          action: {
            label: "Ver venta",
            onClick: () => {
              router.push(`/ventas/historial/${payloadResponse.idVenta}`)
            },
          },
        }
      )

      if (sunatAutoDispatchError) {
        toast.error(sunatAutoDispatchError)
      }

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

  const formBody = (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-xl border bg-slate-50/60 p-4 md:grid-cols-[1.4fr_0.8fr_0.8fr] dark:bg-slate-900/20">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cliente
          </p>
          <p className="mt-1 truncate text-sm font-medium">
            {clienteDetalleTarget?.nombres || target?.nombreCliente || "Sin cliente"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {loadingClienteDetalle
              ? "Cargando datos del cliente..."
              : clienteDetalleTarget?.tipoDocumento && clienteDetalleTarget.nroDocumento
                ? `${clienteDetalleTarget.tipoDocumento}: ${clienteDetalleTarget.nroDocumento}`
                : clienteDetalleError ?? "Sin documento registrado"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setClientEditOpen(true)}
            disabled={submitting || targetClienteId === null || loadingClienteDetalle || !clienteDetalleTarget}
            className="mt-3 h-8 gap-1.5"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Editar cliente
          </Button>
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
          placeholder="Selecciona comprobante"
          searchPlaceholder="Buscar comprobante..."
          emptyMessage="No hay comprobantes activos para esta sucursal"
          loading={loadingComprobantes}
        />
        {errorComprobantes && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{errorComprobantes}</p>
        )}
        {facturaClientMessage && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            {facturaClientMessage}
          </div>
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
        <label
          htmlFor="convertir-venta-codigo-operacion"
          className="text-sm font-medium text-foreground"
        >
          Codigo de operacion
        </label>
        <input
          id="convertir-venta-codigo-operacion"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={operationCode}
          onChange={(event) => setOperationCode(sanitizeNumericInput(event.target.value))}
          placeholder="Obligatorio. Solo numeros"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="convertir-venta-fecha-operacion"
          className="text-sm font-medium text-foreground"
        >
          Fecha y hora de la operacion
        </label>
        <input
          id="convertir-venta-fecha-operacion"
          type="datetime-local"
          value={operationDateTime}
          onChange={(event) => {
            setOperationDateTime(event.target.value)
            setOperationDateTimeError("")
            setRequestError(null)
          }}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
        />
        {operationDateTimeError && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {operationDateTimeError}
          </p>
        )}
      </div>

      {requestError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {requestError}
        </div>
      )}
    </div>
)

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="flex h-[92dvh] flex-col gap-0 p-0">
            <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
              <SheetTitle className="text-sm">Convertir a venta</SheetTitle>
              <SheetDescription className="text-xs sm:text-sm">
                Registra una venta real a partir de la cotizacion{" "}
                <span className="font-semibold text-foreground">
                  {target ? `#${target.idCotizacion}` : ""}
                </span>
                .
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {formBody}
            </div>

            <SheetFooter className="shrink-0 border-t border-slate-100 px-4 py-4 dark:border-slate-700/60">
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={submitting} className="h-11">
                  Cancelar
                </Button>
              </SheetClose>
              <Button
                type="button"
                onClick={handleConvert}
                disabled={!canConvert}
                className="h-11"
              >
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
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <ClienteEditDialog
          open={clientEditOpen}
          cliente={clienteDetalleTarget}
          onOpenChange={setClientEditOpen}
          onUpdate={handleUpdateClient}
        />
      </>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[560px]" showCloseButton={!submitting}>
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
          {formBody}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleConvert}
              disabled={!canConvert}
            >
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

      <ClienteEditDialog
        open={clientEditOpen}
        cliente={clienteDetalleTarget}
        onOpenChange={setClientEditOpen}
        onUpdate={handleUpdateClient}
      />
    </>
  )
}
