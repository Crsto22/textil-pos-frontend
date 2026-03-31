"use client"

import Image from "next/image"
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  CreditCardIcon,
  CubeIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  UserIcon,
} from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { useState, type ComponentType } from "react"
import { toast } from "sonner"

import {
  getMetodoPagoIcon,
  getMetodoPagoLabel,
  getMetodoPagoLogo,
} from "@/components/pagos/pagos.utils"
import {
  formatComprobante,
  getEstadoBadgeClass,
  formatFechaHora,
  formatMonto,
  getSunatBadgeClass,
  isSunatNotApplicable,
  normalizeSunatEstado,
} from "@/components/ventas/historial/historial.utils"
import {
  downloadVentaDocument,
  getVentaDownloadConfig,
  type VentaDocumentKind,
} from "@/lib/venta-documents"
import { appliesIgvForComprobante } from "@/lib/venta-tax"
import type {
  VentaAnularRequest,
  VentaAnularResult,
  VentaDetalleResponse,
} from "@/lib/types/venta"

import { AnularVentaDialog } from "./AnularVentaDialog"
import { EditCodigoOperacionDialog } from "./EditCodigoOperacionDialog"

interface VentaDetalleContentProps {
  detalle: VentaDetalleResponse | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onRetrySunat: () => Promise<{ ok: boolean; message: string }>
  onAnularVenta: (payload: VentaAnularRequest) => Promise<VentaAnularResult>
  retryingSunat: boolean
  anulandoVenta: boolean
}

interface DetailMetaItemProps {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  secondary?: string
}


function formatMonedaLabel(moneda: string): string {
  const normalized = moneda.trim().toUpperCase()
  if (normalized === "PEN") return "PEN (Sol Peruano)"
  if (normalized === "USD") return "USD (Dolar Americano)"
  return moneda || "Sin moneda"
}

function canRetrySunat(estado: string | null | undefined): boolean {
  const normalized = normalizeSunatEstado(estado)
  return ["PENDIENTE", "OBSERVADO", "RECHAZADO", "ERROR"].includes(normalized)
}

function canDownloadSunatDocuments(estado: string | null | undefined): boolean {
  return normalizeSunatEstado(estado) === "ACEPTADO"
}

function DetailMetaItem({ icon: Icon, label, value, secondary }: DetailMetaItemProps) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{value}</p>
          {secondary ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{secondary}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function VentaDetalleContent({
  detalle,
  loading,
  error,
  onRetry,
  onRetrySunat,
  onAnularVenta,
  retryingSunat,
  anulandoVenta,
}: VentaDetalleContentProps) {
  const router = useRouter()
  const [downloadingKind, setDownloadingKind] = useState<VentaDocumentKind | null>(null)
  const [expandedSunatMetaVentaId, setExpandedSunatMetaVentaId] = useState<number | null>(null)
  const [editingPago, setEditingPago] = useState<NonNullable<VentaDetalleResponse>["pagos"][0] | null>(null)
  const [anularDialogOpen, setAnularDialogOpen] = useState(false)
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
    const result = await downloadVentaDocument(
      kind === "comprobante"
        ? {
            ...config,
            disposition: "download",
            successMessage: "Comprobante descargado correctamente.",
          }
        : kind === "ticket"
          ? {
              ...config,
              disposition: "download",
              successMessage: "Ticket descargado correctamente.",
            }
          : config
    )

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

  const isDownloadingComprobante = downloadingKind === "comprobante"
  const isDownloadingTicket = downloadingKind === "ticket"
  const isDownloadingXml = downloadingKind === "xml"
  const isDownloadingCdrXml = downloadingKind === "cdr-xml"
  const isDownloadingCdrZip = downloadingKind === "cdr-zip"
  const showSunatActions = detalle ? !isSunatNotApplicable(detalle.sunatEstado) : false
  const showSunatDownloads = detalle ? canDownloadSunatDocuments(detalle.sunatEstado) : false
  const showIgv = detalle ? appliesIgvForComprobante(detalle.tipoComprobante) : false
  const normalizedTipoComprobante = detalle?.tipoComprobante.trim().toUpperCase() ?? ""
  const normalizedEstadoVenta = detalle?.estado.trim().toUpperCase() ?? ""
  const showNotaCreditoButton = ["BOLETA", "FACTURA"].includes(normalizedTipoComprobante)
  const disableVentaActions = ["ANULADA", "ANULACION_PENDIENTE", "NC_EMITIDA"].includes(normalizedEstadoVenta)

  const montoBruto = detalle?.detalles.reduce(
    (acc, item) => acc + item.cantidad * item.precioUnitario,
    0
  ) ?? 0;

  const handleOpenNotaCredito = () => {
    if (!detalle) return

    const searchParams = new URLSearchParams({
      idVenta: String(detalle.idVenta),
    })

    router.push(`/ventas/nota-credito/nueva?${searchParams.toString()}`)
  }

  return (
    <>
      <div className="space-y-4">
        {loading && (
          <div className="rounded-2xl border bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
            Cargando detalle de venta...
          </div>
        )}

        {!loading && error && (
          <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 dark:border-rose-900/60 dark:bg-rose-900/20">
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
          <article className="w-full overflow-hidden rounded-2xl border bg-card shadow-sm">
            <header className="border-b border-border/60 px-6 py-6 sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getEstadoBadgeClass(detalle.estado)}`}
                    >
                      {detalle.estado}
                    </span>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Emitido el {formatFechaHora(detalle.fecha)}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-3xl font-black tracking-tight text-foreground sm:text-[2.2rem]">
                      {detalle.tipoComprobante}{" "}
                      <span className="font-light text-muted-foreground">
                        {formatComprobante(detalle)}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="min-w-[180px] text-left sm:text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Monto total
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                    {formatMonto(detalle.total, detalle.moneda)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                <div className="flex flex-wrap items-center gap-2">
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
                      className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-3 py-1.5  font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 "
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
                        void handleDocumentAction("cdr-xml")
                      }}
                      disabled={downloadingKind !== null}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-1.5  font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 "
                    >
                      {isDownloadingCdrXml ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <DocumentTextIcon className="h-4 w-4" />
                      )}
                      {isDownloadingCdrXml ? "Descargando CDR..." : "Ver CDR"}
                    </button>
                  )}
                  {showSunatActions && showSunatDownloads && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleDocumentAction("cdr-zip")
                      }}
                      disabled={downloadingKind !== null}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-1.5  font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 "
                    >
                      {isDownloadingCdrZip ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      )}
                      {isDownloadingCdrZip ? "Descargando CDR..." : "Descargar CDR"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      void handleDocumentAction("comprobante")
                    }}
                    disabled={downloadingKind !== null}
                    className="inline-flex items-center gap-2 rounded-lg  bg-red-500 px-3 py-1.5  font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 "
                  >
                    {isDownloadingComprobante ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    )}
                    {isDownloadingComprobante ? "Descargando PDF..." : "Descargar PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDocumentAction("ticket")
                    }}
                    disabled={downloadingKind !== null}
                    className="inline-flex items-center gap-2 rounded-lg  bg-orange-500 px-3 py-1.5  font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 "
                  >
                    {isDownloadingTicket ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    )}
                    {isDownloadingTicket ? "Descargando ticket..." : "Descargar ticket"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getSunatBadgeClass(detalle.sunatEstado)}`}
                  >
                    SUNAT {detalle.sunatEstado || "N/A"}
                  </span>
                  <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {detalle.estado}
                  </span>
                </div>
              </div>
            </header>

            <section className="border-b border-border/60 px-2 py-6 sm:px-4">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <DetailMetaItem
                  icon={UserIcon}
                  label="Cliente"
                  value={detalle.nombreCliente}
                  secondary={`ID ${detalle.idCliente ?? "-"}`}
                />
                <DetailMetaItem
                  icon={UserIcon}
                  label="Usuario"
                  value={detalle.nombreUsuario || "Sin usuario"}
                  secondary={`Venta #${detalle.idVenta}`}
                />
                <DetailMetaItem
                  icon={BuildingOffice2Icon}
                  label="Sucursal"
                  value={detalle.nombreSucursal || "Sin sucursal"}
                  secondary="Punto de emision"
                />
                <DetailMetaItem
                  icon={DocumentTextIcon}
                  label="Moneda"
                  value={formatMonedaLabel(detalle.moneda)}
                  secondary={`Serie ${detalle.serie || "-"}`}
                />
              </div>

              {!isSunatNotApplicable(detalle.sunatEstado) && (
                <div className="mt-6 border-t border-border/60 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedSunatMetaVentaId((current) =>
                        current === detalle.idVenta ? null : detalle.idVenta
                      )
                    }}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {isCurrentSunatMetaExpanded ? "Ocultar detalles SUNAT" : "Ver detalles SUNAT"}
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform ${isCurrentSunatMetaExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              )}
            </section>

            {!isSunatNotApplicable(detalle.sunatEstado) && isCurrentSunatMetaExpanded && (
              <section className="border-b border-border/60 bg-muted/30 px-6 py-5 sm:px-8">
                <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-1">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Mensaje SUNAT
                    </dt>
                    <dd className="text-sm text-foreground">
                      {detalle.sunatMensaje || "Sin mensaje"}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Hash
                    </dt>
                    <dd className="break-all text-sm text-foreground">
                      {detalle.sunatHash || "-"}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Archivos SUNAT
                    </dt>
                    <dd className="space-y-0.5 text-sm text-foreground">
                      <p>XML: {detalle.sunatXmlNombre || "-"}</p>
                      <p>ZIP: {detalle.sunatZipNombre || "-"}</p>
                      <p>CDR: {detalle.sunatCdrNombre || "-"}</p>
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Respuesta SUNAT
                    </dt>
                    <dd className="space-y-0.5 text-sm text-foreground">
                      <p>Enviado: {detalle.sunatEnviadoAt ? formatFechaHora(detalle.sunatEnviadoAt) : "-"}</p>
                      <p>
                        Respondido:{" "}
                        {detalle.sunatRespondidoAt ? formatFechaHora(detalle.sunatRespondidoAt) : "-"}
                      </p>
                      <p>Codigo: {detalle.sunatCodigo || "-"}</p>
                      <p>Ticket: {detalle.sunatTicket || "-"}</p>
                    </dd>
                  </div>
                </dl>
              </section>
            )}

            <section className="border-b border-border/60 px-2 py-6 sm:px-4">
              <div className="mb-5 flex items-center gap-2">
                <CubeIcon className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-lg font-semibold tracking-tight text-foreground">
                  Resumen de productos
                </h4>
              </div>

              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1320px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-3 text-left">Producto</th>
                        <th className="px-3 py-3 text-left">Descripcion</th>
                        <th className="px-3 py-3 text-left">Talla</th>
                        <th className="px-3 py-3 text-left">Color</th>
                        <th className="px-3 py-3 text-left">SKU</th>
                        <th className="px-3 py-3 text-left">U. med.</th>
                        <th className="px-3 py-3 text-left">Afect.</th>
                        <th className="px-3 py-3 text-center">Cant.</th>
                        <th className="px-3 py-3 text-right">P. unitario</th>
                        <th className="px-3 py-3 text-right">Descuento</th>
                        <th className="px-3 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.detalles.length > 0 ? (
                        detalle.detalles.map((item) => (
                          <tr
                            key={item.idVentaDetalle}
                            className="border-b align-top transition-colors last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-3 py-4">
                              <p className="min-w-[180px] font-semibold uppercase tracking-[0.01em] text-foreground">
                                {item.nombreProducto}
                              </p>
                            </td>
                            <td className="px-3 py-4">
                              <p className="min-w-[220px] text-sm text-muted-foreground">
                                {item.descripcion || "-"}
                              </p>
                            </td>
                            <td className="px-3 py-4">
                              <span className="text-sm font-medium text-foreground">
                                {item.talla || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <span className="text-sm text-muted-foreground">
                                {item.color || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <span className="inline-flex rounded-md border bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                                {item.sku || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <span className="text-sm text-muted-foreground">
                                {item.unidadMedida}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <span className="text-sm text-muted-foreground">
                                {item.codigoTipoAfectacionIgv}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-center font-semibold text-foreground">
                              {item.cantidad}
                            </td>
                            <td className="px-3 py-4 text-right">
                              <p className="font-medium text-foreground">
                                {formatMonto(item.precioUnitario, detalle.moneda)}
                              </p>
                            </td>
                            <td className="px-3 py-4 text-right">
                              <p className="font-medium text-foreground">
                                {formatMonto(item.descuento, detalle.moneda)}
                              </p>
                            </td>
                            <td className="px-3 py-4 text-right">
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground">
                                  {formatMonto(item.totalDetalle, detalle.moneda)}
                                </p>
                                {showIgv ? (
                                  <p className="text-[11px] text-muted-foreground">
                                    IGV {formatMonto(item.igvDetalle, detalle.moneda)}
                                  </p>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={11}
                            className="px-3 py-10 text-center text-sm text-muted-foreground"
                          >
                            No hay items registrados en este comprobante.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="px-2 py-6 sm:px-4">
              <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_480px]">
                <div>
                  <div className="mb-5 flex items-center gap-2">
                    <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Metodo de pago
                    </h4>
                  </div>

                  <div className="divide-y divide-border">
                    {detalle.pagos.length > 0 ? (
                      detalle.pagos.map((pago) => {
                        const metodoLogo = getMetodoPagoLogo(pago.nombreMetodoPago)
                        const MetodoPagoIcon = getMetodoPagoIcon(pago.nombreMetodoPago)
                        const metodoLabel = getMetodoPagoLabel(pago.nombreMetodoPago)

                        return (
                          <div
                            key={pago.idPago}
                            className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-muted/30">
                                {metodoLogo ? (
                                  <Image
                                    src={metodoLogo.src}
                                    alt={metodoLogo.alt}
                                    width={28}
                                    height={28}
                                    className="h-7 w-7 object-contain"
                                  />
                                ) : (
                                  <MetodoPagoIcon className="h-5 w-5 text-muted-foreground" />
                                )}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-sm font-semibold text-foreground">
                                    {metodoLabel}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    Cod. op.: {pago.codigoOperacion || "-"}
                                    <button
                                      type="button"
                                      onClick={() => setEditingPago(pago)}
                                      className="text-muted-foreground transition-colors hover:text-foreground"
                                      title="Editar Codigo de Operacion"
                                    >
                                      <PencilSquareIcon className="h-4 w-4" />
                                    </button>
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {pago.fecha ? formatFechaHora(pago.fecha) : "Sin fecha registrada"}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-lg font-semibold text-foreground">
                                {formatMonto(pago.monto, detalle.moneda)}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-8 text-sm text-muted-foreground">
                        No hay pagos registrados para este comprobante.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {showNotaCreditoButton && (
                      <button
                        type="button"
                        onClick={handleOpenNotaCredito}
                        disabled={disableVentaActions || anulandoVenta}
                        className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        VER NOTAS DE CREDITO
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAnularDialogOpen(true)
                      }}
                      disabled={disableVentaActions || anulandoVenta}
                      className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${anulandoVenta ? "animate-spin" : ""}`} />
                      {anulandoVenta ? "ANULANDO..." : "ANULAR"}
                    </button>
                  </div>
                </div>

                <div className="border-t border-border pt-4 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
                  <div className="mb-5 flex items-center gap-2">
                    <BanknotesIcon className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Resumen
                    </h4>
                  </div>

                  <div className="space-y-4 text-base">
                    <div className="flex items-center justify-between gap-4 text-muted-foreground">
                      <span>Suma de productos</span>
                      <span className="text-lg font-semibold text-foreground">
                        {formatMonto(montoBruto, detalle.moneda)}
                      </span>
                    </div>

                    {detalle.descuentoTotal > 0 && (
                      <div className="flex items-center justify-between gap-4 text-muted-foreground">
                        <span>Descuentos aplicados</span>
                        <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                          - {formatMonto(detalle.descuentoTotal, detalle.moneda)}
                        </span>
                      </div>
                    )}

                    {showIgv ? (
                      <div className="border-t border-border border-dashed pt-4 space-y-4">
                        <div className="flex items-center justify-between gap-4 text-muted-foreground">
                          <span>Op. Gravadas (Subtotal)</span>
                          <span className="text-lg font-semibold text-foreground">
                            {formatMonto(detalle.subtotal, detalle.moneda)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-muted-foreground">
                          <span>IGV ({detalle.igvPorcentaje.toFixed(2)}%)</span>
                          <span className="text-lg font-semibold text-foreground">
                            {formatMonto(detalle.igv, detalle.moneda)}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div className="border-t border-border pt-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                        Total a pagar
                      </p>
                      <div className="mt-4 text-right text-4xl font-black tracking-tight text-foreground 2xl:text-[2.75rem]">
                        {formatMonto(detalle.total, detalle.moneda)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </article>
        )}
      </div>

      <EditCodigoOperacionDialog
        pago={editingPago}
        open={!!editingPago}
        onOpenChange={(open) => !open && setEditingPago(null)}
        onSuccess={onRetry}
      />

      <AnularVentaDialog
        key={anularDialogOpen ? "anular-open" : "anular-closed"}
        open={anularDialogOpen}
        detalle={detalle}
        isSubmitting={anulandoVenta}
        onOpenChange={setAnularDialogOpen}
        onConfirm={onAnularVenta}
      />
    </>
  )
}
