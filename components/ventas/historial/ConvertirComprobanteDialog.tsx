"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowPathIcon,
  CheckCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { ClienteCreateDialog } from "@/components/clientes/modals/ClienteCreateDialog"
import { ClienteEditDialog } from "@/components/clientes/modals/ClienteEditDialog"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import ClientSelect, { type ClientSelection } from "@/components/ventas/ClientSelect"
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
import { buildComprobanteDescription, buildComprobanteLabel } from "@/lib/comprobante"
import { useClienteCreate } from "@/lib/hooks/useClienteCreate"
import { useClienteDetalle } from "@/lib/hooks/useClienteDetalle"
import { useComprobanteOptions } from "@/lib/hooks/useComprobanteOptions"
import type {
  Cliente,
  ClienteCreatePrefill,
  ClienteCreateRequest,
  ClienteUpdateRequest,
} from "@/lib/types/cliente"
import type { ComprobanteConfig } from "@/lib/types/comprobante"
import type { MonedaCodigo, TipoComprobante } from "@/lib/types/venta"
import { formatComprobante, formatMonto } from "@/components/ventas/historial/historial.utils"

interface VentaConvertible {
  idVenta: number
  tipoComprobante: TipoComprobante
  serie: string
  correlativo: number
  idCliente: number | null
  nombreCliente: string
  moneda: MonedaCodigo
  total: number
}

interface ConvertirComprobanteDialogProps {
  open: boolean
  venta: VentaConvertible | null
  onOpenChange: (open: boolean) => void
  onConverted: () => Promise<void> | void
}

const GENERIC_CLIENT: ClientSelection = {
  idCliente: null,
  nombre: "Cliente Generico",
}

function normalizeTipo(value: string | null | undefined): string {
  return value?.trim().toUpperCase() ?? ""
}

function isComprobanteDestino(comprobante: ComprobanteConfig) {
  const tipo = normalizeTipo(comprobante.tipoComprobante)
  return tipo === "BOLETA" || tipo === "FACTURA"
}

function getMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback
  const data = payload as Record<string, unknown>
  return typeof data.message === "string" && data.message.trim() ? data.message : fallback
}

function toClientSelection(cliente: Cliente): ClientSelection {
  return {
    idCliente: cliente.idCliente,
    nombre: cliente.nombres,
    tipoDocumento: cliente.tipoDocumento,
    nroDocumento: cliente.nroDocumento,
    telefono: cliente.telefono,
    correo: cliente.correo,
    direccion: cliente.direccion,
    estado: cliente.estado,
  }
}

function isValidDocumentoCliente(tipoDocumento?: string | null, nroDocumento?: string | null) {
  const tipo = normalizeTipo(tipoDocumento)
  const nro = nroDocumento?.trim() ?? ""
  if (tipo === "SIN_DOC" || !tipo) return false
  if (tipo === "DNI") return /^\d{8}$/.test(nro)
  if (tipo === "RUC") return /^\d{11}$/.test(nro)
  return nro.length > 0
}

export function ConvertirComprobanteDialog({
  open,
  venta,
  onOpenChange,
  onConverted,
}: ConvertirComprobanteDialogProps) {
  const [selectedComprobanteId, setSelectedComprobanteId] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<ClientSelection>(GENERIC_CLIENT)
  const [clienteCreatePrefill, setClienteCreatePrefill] =
    useState<ClienteCreatePrefill | null>(null)
  const [clienteCreateOpen, setClienteCreateOpen] = useState(false)
  const [clienteEditOpen, setClienteEditOpen] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    clienteId: loadedClienteId,
    detalle: clienteDetalle,
    loading: loadingClienteDetalle,
    error: clienteDetalleError,
    openClienteDetalle,
    closeClienteDetalle,
  } = useClienteDetalle()
  const { createCliente } = useClienteCreate({
    successMessage: "Cliente creado correctamente",
  })
  const {
    comprobantes,
    loadingComprobantes,
    errorComprobantes,
    searchComprobante,
    setSearchComprobante,
  } = useComprobanteOptions({
    enabled: open,
    habilitadoVenta: true,
  })

  useEffect(() => {
    if (!open || !venta) return

    setSelectedCliente(
      venta.idCliente
        ? {
            idCliente: venta.idCliente,
            nombre: venta.nombreCliente || "Cliente",
          }
        : GENERIC_CLIENT
    )
    setClienteCreatePrefill(null)
    setClienteCreateOpen(false)
    setClienteEditOpen(false)
    setRequestError(null)

    if (venta.idCliente) {
      void openClienteDetalle(venta.idCliente)
    } else {
      closeClienteDetalle()
    }
  }, [closeClienteDetalle, open, openClienteDetalle, venta])

  const comprobantesDestino = useMemo(() => {
    const normalizedSearch = searchComprobante.trim().toLowerCase()
    return comprobantes.filter((item) => {
      if (!isComprobanteDestino(item)) return false
      if (!normalizedSearch) return true

      const label = buildComprobanteLabel(item).toLowerCase()
      return (
        label.includes(normalizedSearch) ||
        item.tipoComprobante.toLowerCase().includes(normalizedSearch) ||
        item.serie.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [comprobantes, searchComprobante])

  const comprobanteOptions = useMemo<ComboboxOption[]>(
    () =>
      comprobantesDestino.map((item) => ({
        value: String(item.idComprobante),
        label: buildComprobanteLabel(item),
        description: buildComprobanteDescription(item),
      })),
    [comprobantesDestino]
  )

  useEffect(() => {
    if (!open) {
      setSelectedComprobanteId("")
      setRequestError(null)
      setSearchComprobante("")
      return
    }

    if (selectedComprobanteId) return
    if (comprobanteOptions.length === 0) return
    setSelectedComprobanteId(comprobanteOptions[0].value)
  }, [comprobanteOptions, open, selectedComprobanteId, setSearchComprobante])

  const effectiveSelectedComprobanteId = useMemo(() => {
    if (!selectedComprobanteId) return ""
    if (comprobanteOptions.some((option) => option.value === selectedComprobanteId)) {
      return selectedComprobanteId
    }
    return comprobanteOptions[0]?.value ?? ""
  }, [comprobanteOptions, selectedComprobanteId])

  const selectedComprobante = useMemo(
    () =>
      comprobantesDestino.find(
        (item) => String(item.idComprobante) === effectiveSelectedComprobanteId
      ) ?? null,
    [comprobantesDestino, effectiveSelectedComprobanteId]
  )

  const selectedTipoComprobante = normalizeTipo(selectedComprobante?.tipoComprobante)
  const isFacturaSelected = selectedTipoComprobante === "FACTURA"
  const isBoletaSelected = selectedTipoComprobante === "BOLETA"
  const selectedClienteDetalle =
    selectedCliente.idCliente && loadedClienteId === selectedCliente.idCliente
      ? clienteDetalle
      : null
  const selectedClienteNombre =
    selectedClienteDetalle?.nombres || selectedCliente.nombre || "Cliente Generico"
  const selectedClienteTipoDocumento =
    selectedClienteDetalle?.tipoDocumento || selectedCliente.tipoDocumento || ""
  const selectedClienteNroDocumento =
    selectedClienteDetalle?.nroDocumento || selectedCliente.nroDocumento || ""
  const selectedClienteEstado = selectedClienteDetalle?.estado || selectedCliente.estado || ""
  const selectedClienteHasRuc =
    normalizeTipo(selectedClienteTipoDocumento) === "RUC" &&
    /^\d{11}$/.test(selectedClienteNroDocumento.trim())
  const selectedClienteHasValidDocument = isValidDocumentoCliente(
    selectedClienteTipoDocumento,
    selectedClienteNroDocumento
  )

  const isNotaVenta = normalizeTipo(venta?.tipoComprobante) === "NOTA DE VENTA"
  const clientValidationMessage = useMemo(() => {
    if (!selectedComprobante || !venta) return null
    if (!isNotaVenta) return "Solo se puede convertir una nota de venta."
    if (loadingClienteDetalle && selectedCliente.idCliente) {
      return "Validando datos del cliente..."
    }

    if (isFacturaSelected) {
      if (!selectedCliente.idCliente) {
        return "Para emitir factura, selecciona o crea un cliente con RUC."
      }
      if (!selectedClienteHasRuc) {
        return "Para emitir factura, el cliente debe tener RUC valido de 11 digitos."
      }
    }

    if (isBoletaSelected && venta.total > 700) {
      if (!selectedCliente.idCliente) {
        return "Para boleta mayor a S/ 700, selecciona o crea un cliente identificado."
      }
      if (!selectedClienteHasValidDocument) {
        return "Para boleta mayor a S/ 700, el cliente debe tener documento valido."
      }
    }

    return null
  }, [
    isBoletaSelected,
    isFacturaSelected,
    isNotaVenta,
    loadingClienteDetalle,
    selectedCliente.idCliente,
    selectedClienteHasRuc,
    selectedClienteHasValidDocument,
    selectedComprobante,
    venta,
  ])
  const canSubmit =
    Boolean(venta && isNotaVenta && selectedComprobante) &&
    !clientValidationMessage &&
    !submitting

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return
    if (!nextOpen) {
      closeClienteDetalle()
    }
    onOpenChange(nextOpen)
  }

  const handleSelectCliente = (client: ClientSelection) => {
    setSelectedCliente(client)
    setRequestError(null)
    if (client.idCliente) {
      void openClienteDetalle(client.idCliente)
    } else {
      closeClienteDetalle()
    }
  }

  const handleCreateClientRequest = (prefill: ClienteCreatePrefill) => {
    setClienteCreatePrefill(prefill)
    setClienteCreateOpen(true)
  }

  const handleCreateCliente = async (payload: ClienteCreateRequest) => {
    const created = await createCliente(payload)
    if (created) {
      handleSelectCliente(toClientSelection(created))
    }
    return created
  }

  const handleUpdateCliente = async (id: number, payload: ClienteUpdateRequest) => {
    try {
      const response = await authFetch(`/api/cliente/actualizar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message = getMessage(data, "No se pudo actualizar el cliente")
        toast.error(message)
        return false
      }

      toast.success(getMessage(data, "Cliente actualizado correctamente"))
      await openClienteDetalle(id)
      setSelectedCliente({
        idCliente: id,
        nombre: payload.nombres,
        tipoDocumento: payload.tipoDocumento,
        nroDocumento: payload.nroDocumento,
        telefono: payload.telefono,
        correo: payload.correo,
        direccion: payload.direccion,
        estado: payload.estado,
      })
      setRequestError(null)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar el cliente"
      toast.error(message)
      return false
    }
  }

  const handleConvert = async () => {
    if (!venta || !selectedComprobante || submitting) return

    if (clientValidationMessage) {
      setRequestError(clientValidationMessage)
      toast.error(clientValidationMessage)
      return
    }

    setSubmitting(true)
    setRequestError(null)

    try {
      const response = await authFetch(`/api/venta/${venta.idVenta}/convertir-comprobante`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoComprobante: selectedComprobante.tipoComprobante,
          serie: selectedComprobante.serie,
          ...(selectedCliente.idCliente ? { idCliente: selectedCliente.idCliente } : {}),
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message = getMessage(payload, "No se pudo convertir la nota de venta")
        setRequestError(message)
        toast.error(message)
        return
      }

      toast.success("Nota de venta convertida y enviada a SUNAT.")
      await onConverted()
      closeClienteDetalle()
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo convertir la nota de venta"
      setRequestError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[620px]" showCloseButton={!submitting}>
          <DialogHeader>
            <DialogTitle>Convertir a factura o boleta</DialogTitle>
            <DialogDescription>
              Convierte la nota de venta en comprobante electronico y programa el envio a SUNAT.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 rounded-xl border bg-slate-50/70 p-4 dark:bg-slate-900/30 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nota de venta
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {venta ? formatComprobante(venta) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {venta ? formatMonto(venta.total, venta.moneda) : formatMonto(0)}
                </p>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente seleccionado
                </p>
                <p className="mt-1 truncate text-sm font-semibold">{selectedClienteNombre}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {loadingClienteDetalle
                    ? "Cargando datos del cliente..."
                    : selectedCliente.idCliente
                      ? `${selectedClienteTipoDocumento || "SIN_DOC"} ${selectedClienteNroDocumento || "-"}${selectedClienteEstado ? ` - ${selectedClienteEstado}` : ""}`
                      : "Sin cliente asignado"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Comprobante destino</label>
              <Combobox
                id="venta-convertir-comprobante"
                value={effectiveSelectedComprobanteId}
                options={comprobanteOptions}
                searchValue={searchComprobante}
                onSearchValueChange={setSearchComprobante}
                onValueChange={setSelectedComprobanteId}
                placeholder="Selecciona boleta o factura"
                searchPlaceholder="Buscar serie..."
                emptyMessage="No hay series activas de boleta o factura"
                loading={loadingComprobantes}
                disabled={submitting}
              />
              {errorComprobantes ? (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {errorComprobantes}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Cliente para el comprobante
                  </label>
                  <ClientSelect
                    selected={selectedCliente}
                    onSelect={handleSelectCliente}
                    onCreateClientRequest={handleCreateClientRequest}
                    tipoDocumentoFilter={isFacturaSelected ? "RUC" : null}
                    placeholder={isFacturaSelected ? "Selecciona cliente con RUC" : "Cliente Generico"}
                    searchPlaceholder={isFacturaSelected ? "Buscar RUC o razon social..." : "Buscar cliente..."}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setClienteEditOpen(true)}
                  disabled={!selectedCliente.idCliente || !selectedClienteDetalle || submitting}
                  className="gap-2"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Editar cliente
                </Button>
              </div>
              {clienteDetalleError ? (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {clienteDetalleError}
                </p>
              ) : null}
            </div>

            {clientValidationMessage ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                {clientValidationMessage}
              </div>
            ) : null}

            {requestError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {requestError}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleConvert} disabled={!canSubmit}>
              {submitting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Convertir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClienteCreateDialog
        open={clienteCreateOpen}
        onOpenChange={setClienteCreateOpen}
        onCreate={handleCreateCliente}
        prefill={clienteCreatePrefill}
        onCreated={(cliente) => {
          handleSelectCliente(toClientSelection(cliente))
        }}
      />

      <ClienteEditDialog
        open={clienteEditOpen}
        cliente={selectedClienteDetalle}
        onOpenChange={setClienteEditOpen}
        onUpdate={handleUpdateCliente}
      />
    </>
  )
}
