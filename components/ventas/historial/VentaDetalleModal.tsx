import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  UserIcon,
} from "@heroicons/react/24/outline"
import { useState } from "react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatearRangoOferta } from "@/lib/oferta-utils"
import {
  formatComprobante,
  formatFechaHora,
  formatMonto,
  getSunatBadgeClass,
} from "@/components/ventas/historial/historial.utils"
import {
  downloadVentaDocument,
  getVentaDownloadConfig,
  openVentaDocument,
  type VentaDocumentKind,
} from "@/lib/venta-documents"
import { appliesIgvForComprobante } from "@/lib/venta-tax"
import type { VentaDetalleResponse } from "@/lib/types/venta"
import { EditCodigoOperacionDialog } from "./EditCodigoOperacionDialog"

interface VentaDetalleModalProps {
  open: boolean
  detalle: VentaDetalleResponse | null
  loading: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onRetry: () => void
  onRetrySunat: () => Promise<{ ok: boolean; message: string }>
  retryingSunat: boolean
}

function renderDescuentoLabel(tipoDescuento: string | null): string {
  if (!tipoDescuento) return "Sin descuento"
  return tipoDescuento
}

function normalizeSunatEstado(estado: string | null | undefined): string {
  return (estado ?? "").trim().toUpperCase()
}

function canRetrySunat(estado: string | null | undefined): boolean {
  const normalized = normalizeSunatEstado(estado)
  return ["PENDIENTE", "OBSERVADO", "RECHAZADO", "ERROR"].includes(normalized)
}

function canDownloadSunatDocuments(estado: string | null | undefined): boolean {
  return normalizeSunatEstado(estado) === "ACEPTADO"
}

function isSunatNotApplicable(estado: string | null | undefined): boolean {
  return normalizeSunatEstado(estado) === "NO_APLICA"
}

export function VentaDetalleModal({
  open,
  detalle,
  loading,
  error,
  onOpenChange,
  onRetry,
  onRetrySunat,
  retryingSunat,
}: VentaDetalleModalProps) {
  const [downloadingKind, setDownloadingKind] = useState<VentaDocumentKind | null>(null)
  const [expandedSunatMetaVentaId, setExpandedSunatMetaVentaId] = useState<number | null>(null)
  const [editingPago, setEditingPago] = useState<NonNullable<VentaDetalleResponse>["pagos"][0] | null>(null)
  const isCurrentSunatMetaExpanded =
    detalle !== null && expandedSunatMetaVentaId === detalle.idVenta

  const handleDocumentAction = async (kind: VentaDocumentKind) => {
    if (!detalle || downloadingKind) return

    setDownloadingKind(kind)
    const config = getVentaDownloadConfig(kind, {
      idVenta: detalle.idVenta,
      sunatXmlNombre: detalle.sunatXmlNombre,
      sunatCdrNombre: detalle.sunatCdrNombre,
    })
    const result =
      kind === "comprobante" ? await openVentaDocument(config) : await downloadVentaDocument(config)

    setDownloadingKind(null)

    if (result.ok) {
      toast.success(result.message)
      return
    }

    toast.error(result.message)
  }

  const handleRetrySunat = async () => {
    const result = await onRetrySunat()
    if (result.ok) {
      toast.success(result.message)
      return
    }
    toast.error(result.message)
  }

  const isOpeningComprobante = downloadingKind === "comprobante"
  const isDownloadingXml = downloadingKind === "xml"
  const isDownloadingCdr = downloadingKind === "cdr"
  const showSunatActions = detalle ? !isSunatNotApplicable(detalle.sunatEstado) : false
  const showSunatDownloads = detalle ? canDownloadSunatDocuments(detalle.sunatEstado) : false
  const showIgv = detalle ? appliesIgvForComprobante(detalle.tipoComprobante) : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[96vh] w-[96vw] overflow-y-auto p-0 sm:max-w-[1200px]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Detalle de Venta</DialogTitle>
          <DialogDescription>
            Comprobante, items y pagos de la venta seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/20 dark:text-slate-300">
              Cargando detalle de venta...
            </div>
          )}

          {!loading && error && (
            <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 dark:border-rose-900/60 dark:bg-rose-900/20">
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/40"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && detalle && (
            <article className="overflow-hidden rounded-xl border bg-background">
              <header className="border-b bg-slate-50 px-5 py-4 dark:bg-slate-900/30">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      POS Textil
                    </p>
                    <h3 className="text-lg font-semibold">
                      {detalle.tipoComprobante} {formatComprobante(detalle)}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Moneda {detalle.moneda} / SUNAT {detalle.sunatEstado || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {showSunatActions && canRetrySunat(detalle.sunatEstado) && (
                      <button
                        type="button"
                        onClick={() => {
                          void handleRetrySunat()
                        }}
                        disabled={retryingSunat}
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/35"
                      >
                        <ArrowPathIcon className={`h-4 w-4 ${retryingSunat ? "animate-spin" : ""}`} />
                        {retryingSunat ? "Reintentando SUNAT..." : "Reintentar SUNAT"}
                      </button>
                    )}
                    {showSunatActions && showSunatDownloads && (
                      <button
                        type="button"
                        onClick={() => {
                          void handleDocumentAction("xml")
                        }}
                        disabled={downloadingKind !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35"
                      >
                        {isDownloadingXml ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        )}
                        {isDownloadingXml ? "Descargando XML..." : "Descargar XML"}
                      </button>
                    )}
                    {showSunatActions && showSunatDownloads && (
                      <button
                        type="button"
                        onClick={() => {
                          void handleDocumentAction("cdr")
                        }}
                        disabled={downloadingKind !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-700/50 dark:bg-sky-900/20 dark:text-sky-300 dark:hover:bg-sky-900/35"
                      >
                        {isDownloadingCdr ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        )}
                        {isDownloadingCdr ? "Descargando CDR..." : "Descargar CDR"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        void handleDocumentAction("comprobante")
                      }}
                      disabled={downloadingKind !== null}
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                    >
                      {isOpeningComprobante ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      )}
                      {isOpeningComprobante ? "Abriendo PDF..." : "Abrir PDF"}
                    </button>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getSunatBadgeClass(detalle.sunatEstado)}`}
                    >
                      SUNAT {detalle.sunatEstado || "N/A"}
                    </span>
                    <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                      {detalle.estado}
                    </span>
                  </div>
                </div>
              </header>

              <div className="grid gap-4 border-b px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cliente:</span>
                    <span>{detalle.nombreCliente}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm">
                    <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Fecha:</span>
                    <span>{formatFechaHora(detalle.fecha)}</span>
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Usuario:</span>{" "}
                    <span>{detalle.nombreUsuario || "Sin usuario"}</span>
                  </p>
                  <p>
                    <span className="font-medium">Sucursal:</span>{" "}
                    <span>{detalle.nombreSucursal || "Sin sucursal"}</span>
                  </p>
                </div>
                <div className="  p-3">
                  <div className="flex items-center justify-between gap-3">
                    {!isSunatNotApplicable(detalle.sunatEstado) && (
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedSunatMetaVentaId((current) =>
                            current === detalle.idVenta ? null : detalle.idVenta
                          )
                        }}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {isCurrentSunatMetaExpanded ? "Ocultar detalles" : "Ver mas detalles"}
                        <ChevronDownIcon
                          className={`h-4 w-4 transition-transform ${isCurrentSunatMetaExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!isSunatNotApplicable(detalle.sunatEstado) && isCurrentSunatMetaExpanded && (
                <div className="grid gap-3 border-b bg-slate-50/40 px-5 py-4 md:grid-cols-2 xl:grid-cols-4 dark:bg-slate-900/10">
                  <div className="rounded-lg border bg-slate-50/60 p-3 dark:bg-slate-900/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Mensaje SUNAT
                    </p>
                    <p className="mt-1 text-sm">{detalle.sunatMensaje || "Sin mensaje"}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50/60 p-3 dark:bg-slate-900/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Hash
                    </p>
                    <p className="mt-1 break-all text-sm">{detalle.sunatHash || "-"}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50/60 p-3 dark:bg-slate-900/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Archivos SUNAT
                    </p>
                    <p className="mt-1 break-all text-sm">XML: {detalle.sunatXmlNombre || "-"}</p>
                    <p className="break-all text-sm">ZIP: {detalle.sunatZipNombre || "-"}</p>
                    <p className="break-all text-sm">CDR: {detalle.sunatCdrNombre || "-"}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50/60 p-3 dark:bg-slate-900/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Fechas SUNAT
                    </p>
                    <p className="mt-1 text-sm">
                      Enviado: {detalle.sunatEnviadoAt ? formatFechaHora(detalle.sunatEnviadoAt) : "-"}
                    </p>
                    <p className="text-sm">
                      Respondido:{" "}
                      {detalle.sunatRespondidoAt
                        ? formatFechaHora(detalle.sunatRespondidoAt)
                        : "-"}
                    </p>
                    <p className="mt-2 text-sm">
                      Codigo: {detalle.sunatCodigo || "-"}
                    </p>
                    <p className="text-sm">
                      Ticket: {detalle.sunatTicket || "-"}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-b px-5 py-4">
                <h4 className="mb-3 text-sm font-semibold">Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-left">SKU</th>
                        <th className="px-3 py-2 text-left">Detalle</th>
                        <th className="px-3 py-2 text-center">Cant.</th>
                        <th className="px-3 py-2 text-right">P. Oferta</th>
                        <th className="px-3 py-2 text-right">P. Unit</th>
                        <th className="px-3 py-2 text-right">Desc.</th>
                        {showIgv && <th className="px-3 py-2 text-right">IGV</th>}
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.detalles.map((item) => (
                        <tr key={item.idVentaDetalle} className="border-b last:border-0">
                          <td className="px-3 py-2">
                            <div className="space-y-1">
                              <p className="font-medium">{item.nombreProducto}</p>
                              <p className="text-xs text-muted-foreground">{item.descripcion}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{item.sku || "-"}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            <div className="space-y-1">
                              <p>
                                {item.color || "-"} / {item.talla || "-"}
                              </p>
                              <p className="text-xs">
                                {item.unidadMedida} / Afect. {item.codigoTipoAfectacionIgv}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center font-semibold">{item.cantidad}</td>
                          <td className="px-3 py-2 text-right">
                            {typeof item.precioOferta === "number"
                              ? (
                                  <div className="space-y-0.5 text-right">
                                    <p>{formatMonto(item.precioOferta, detalle.moneda)}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {formatearRangoOferta(item.ofertaInicio, item.ofertaFin)}
                                    </p>
                                  </div>
                                )
                              : "-"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatMonto(item.precioUnitario, detalle.moneda)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatMonto(item.descuento, detalle.moneda)}
                          </td>
                          {showIgv && (
                            <td className="px-3 py-2 text-right">
                              {formatMonto(item.igvDetalle, detalle.moneda)}
                            </td>
                          )}
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatMonto(item.totalDetalle, detalle.moneda)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-b px-5 py-4">
                <h4 className="mb-3 text-sm font-semibold">Pagos</h4>
                <div className="space-y-2">
                  {detalle.pagos.map((pago) => (
                    <div
                      key={pago.idPago}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-md border px-2 py-0.5 text-xs font-semibold">
                          {pago.nombreMetodoPago}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          Cod. op.: {pago.codigoOperacion || "-"}
                          <button
                            type="button"
                            onClick={() => setEditingPago(pago)}
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                            title="Editar Codigo de Operacion"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pago.fecha ? formatFechaHora(pago.fecha) : "-"}
                        </span>
                      </div>
                      <span className="font-semibold">
                        {formatMonto(pago.monto, detalle.moneda)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <footer className="grid gap-2 px-5 py-4 text-sm sm:ml-auto sm:max-w-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatMonto(detalle.subtotal, detalle.moneda)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Descuento ({renderDescuentoLabel(detalle.tipoDescuento)})
                  </span>
                  <span className="font-medium">
                    {formatMonto(detalle.descuentoTotal, detalle.moneda)}
                  </span>
                </div>
                {showIgv && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      IGV ({detalle.igvPorcentaje.toFixed(2)}%)
                    </span>
                    <span className="font-medium">{formatMonto(detalle.igv, detalle.moneda)}</span>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between border-t pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatMonto(detalle.total, detalle.moneda)}</span>
                </div>
              </footer>
            </article>
          )}
        </div>
      </DialogContent>
      
      <EditCodigoOperacionDialog
        pago={editingPago as any}
        open={!!editingPago}
        onOpenChange={(open) => !open && setEditingPago(null)}
        onSuccess={onRetry}
      />
    </Dialog>
  )
}
