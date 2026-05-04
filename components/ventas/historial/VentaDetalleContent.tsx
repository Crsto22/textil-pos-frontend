"use client"

import Image from "next/image"
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  CreditCardIcon,
  CubeIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  UserIcon,
} from "@heroicons/react/24/outline"
import { LoaderSpinner } from "@/components/ui/loader-spinner"
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
  getSunatEstadoLabel,
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
  VentaBajaInfo,
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
  return [
    "PENDIENTE",
    "PENDIENTE_ENVIO",
    "PENDIENTE_CDR",
    "ERROR_TRANSITORIO",
    "ERROR_DEFINITIVO",
    "OBSERVADO",
    "RECHAZADO",
    "ERROR",
  ].includes(normalized)
}

function canDownloadSunatDocuments(estado: string | null | undefined): boolean {
  const normalized = normalizeSunatEstado(estado)
  return normalized === "ACEPTADO" || normalized === "OBSERVADO"
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
  const isDownloadingBajaXml = downloadingKind === "baja-xml"
  const isDownloadingBajaCdr = downloadingKind === "baja-cdr"
  const showSunatActions = detalle ? !isSunatNotApplicable(detalle.sunatEstado) : false
  const showSunatDownloads = detalle ? canDownloadSunatDocuments(detalle.sunatEstado) : false
  const sunatBajaEstadoNorm = detalle?.sunatBajaEstado?.trim().toUpperCase() ?? ""
  const showBajaXml = sunatBajaEstadoNorm !== ""
  const showBajaCdr = ["ACEPTADO", "OBSERVADO"].includes(sunatBajaEstadoNorm)
  const showIgv = detalle ? appliesIgvForComprobante(detalle.tipoComprobante) : false
  const normalizedTipoComprobante = detalle?.tipoComprobante.trim().toUpperCase() ?? ""
  const normalizedEstadoVenta = detalle?.estado.trim().toUpperCase() ?? ""
  const isSunatBaja = ["BOLETA", "FACTURA"].includes(normalizedTipoComprobante)
  const showNotaCreditoButton = isSunatBaja
  const sunatBajaActive = detalle?.sunatBajaEstado
    ? ["PENDIENTE_ENVIO", "PENDIENTE_CDR", "ACEPTADO"].includes(
        detalle.sunatBajaEstado.trim().toUpperCase()
      )
    : false
  const disableVentaActions =
    ["ANULADA", "ANULACION_PENDIENTE", "NC_EMITIDA"].includes(normalizedEstadoVenta) ||
    sunatBajaActive

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
          <div className="rounded-2xl border bg-card px-4 py-12 shadow-sm flex items-center justify-center">
            <LoaderSpinner text="Cargando detalle de venta..." />
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
            <header className="border-b border-border/60 px-4 py-5 sm:px-8 sm:py-6">
              {/* Título + Monto */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] sm:px-3 sm:py-1 sm:text-[11px] ${getEstadoBadgeClass(detalle.estado)}`}
                    >
                      {detalle.estado}
                    </span>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-xs sm:tracking-[0.16em]">
                      Emitido el {formatFechaHora(detalle.fecha)}
                    </p>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-xl font-black leading-tight tracking-tight text-foreground sm:text-3xl sm:text-[2.2rem]">
                      {detalle.tipoComprobante}{" "}
                      <span className="font-light text-muted-foreground">
                        {formatComprobante(detalle)}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="shrink-0 sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                    Monto total
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-foreground sm:mt-2 sm:text-4xl">
                    {formatMonto(detalle.total, detalle.moneda)}
                  </p>
                </div>
              </div>

              {/* Badges de estado */}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 sm:mt-4 sm:pt-4">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${getSunatBadgeClass(detalle.sunatEstado)}`}
                >
                  SUNAT {getSunatEstadoLabel(detalle.sunatEstado)}
                </span>
                {detalle.sunatBajaEstado && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${getSunatBadgeClass(detalle.sunatBajaEstado)}`}
                  >
                    BAJA {getSunatEstadoLabel(detalle.sunatBajaEstado)}
                  </span>
                )}
                <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:px-3 sm:py-1 sm:text-xs">
                  {detalle.estado}
                </span>
              </div>

              {/* Botones de documentos */}
              <div className="mt-3 border-t border-border/60 pt-3 sm:mt-4 sm:pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.16em]">
                  Documentos
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                  {showSunatActions && canRetrySunat(detalle.sunatEstado) && (
                    <button
                      type="button"
                      onClick={() => { void handleRetrySunat() }}
                      disabled={retryingSunat}
                      className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/35 sm:col-span-1 sm:py-1.5"
                    >
                      <ArrowPathIcon className={`h-4 w-4 shrink-0 ${retryingSunat ? "animate-spin" : ""}`} />
                      <span>{retryingSunat ? "Reintentando..." : "Reintentar SUNAT"}</span>
                    </button>
                  )}
                  {showSunatActions && showSunatDownloads && (
                    <button
                      type="button"
                      onClick={() => { void handleDocumentAction("xml") }}
                      disabled={downloadingKind !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5"
                    >
                      {isDownloadingXml ? <ArrowPathIcon className="h-4 w-4 shrink-0 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4 shrink-0" />}
                      <span>{isDownloadingXml ? "Descargando..." : "Descargar XML"}</span>
                    </button>
                  )}
                  {showSunatActions && showSunatDownloads && (
                    <button
                      type="button"
                      onClick={() => { void handleDocumentAction("cdr-xml") }}
                      disabled={downloadingKind !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5"
                    >
                      {isDownloadingCdrXml ? <ArrowPathIcon className="h-4 w-4 shrink-0 animate-spin" /> : <DocumentTextIcon className="h-4 w-4 shrink-0" />}
                      <span>{isDownloadingCdrXml ? "Descargando..." : "Ver CDR"}</span>
                    </button>
                  )}
                  {showSunatActions && showSunatDownloads && (
                    <button
                      type="button"
                      onClick={() => { void handleDocumentAction("cdr-zip") }}
                      disabled={downloadingKind !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5"
                    >
                      {isDownloadingCdrZip ? <ArrowPathIcon className="h-4 w-4 shrink-0 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4 shrink-0" />}
                      <span>{isDownloadingCdrZip ? "Descargando..." : "Descargar CDR"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { void handleDocumentAction("comprobante") }}
                    disabled={downloadingKind !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5"
                  >
                    {isDownloadingComprobante ? <ArrowPathIcon className="h-4 w-4 shrink-0 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4 shrink-0" />}
                    <span>{isDownloadingComprobante ? "Descargando..." : "Descargar PDF"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { void handleDocumentAction("ticket") }}
                    disabled={downloadingKind !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5"
                  >
                    {isDownloadingTicket ? <ArrowPathIcon className="h-4 w-4 shrink-0 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4 shrink-0" />}
                    <span>{isDownloadingTicket ? "Descargando..." : "Descargar ticket"}</span>
                  </button>
                </div>
              </div>

              {/* Documentos de baja SUNAT — sección separada */}
              {(showBajaXml || showBajaCdr) && (
                <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-3 dark:border-orange-900/40 dark:bg-orange-950/20 sm:mt-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-700 dark:text-orange-400 sm:text-[11px] sm:tracking-[0.16em]">
                    Documentos de baja SUNAT
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                    {showBajaXml && (
                      <button
                        type="button"
                        onClick={() => { void handleDocumentAction("baja-xml") }}
                        disabled={downloadingKind !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5"
                      >
                        {isDownloadingBajaXml ? <ArrowPathIcon className="h-4 w-4 shrink-0 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4 shrink-0" />}
                        <span>{isDownloadingBajaXml ? "Descargando..." : "XML de baja"}</span>
                      </button>
                    )}
                    {showBajaCdr && (
                      <button
                        type="button"
                        onClick={() => { void handleDocumentAction("baja-cdr") }}
                        disabled={downloadingKind !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5"
                      >
                        {isDownloadingBajaCdr ? <ArrowPathIcon className="h-4 w-4 shrink-0 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4 shrink-0" />}
                        <span>{isDownloadingBajaCdr ? "Descargando..." : "CDR de baja"}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </header>

            <section className="border-b border-border/60 px-4 py-5 sm:px-4 sm:py-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

            {detalle.sunatBajaEstado && (
              <section className="border-b border-border/60 bg-rose-50/40 px-6 py-5 dark:bg-rose-950/20 sm:px-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-400">
                  Estado de Baja SUNAT
                </p>
                <dl className="grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-1">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado</dt>
                    <dd className="text-sm font-semibold text-foreground">
                      {getSunatEstadoLabel(detalle.sunatBajaEstado)}
                    </dd>
                  </div>
                  {detalle.sunatBajaMensaje && (
                    <div className="space-y-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mensaje</dt>
                      <dd className="text-sm text-foreground">{detalle.sunatBajaMensaje}</dd>
                    </div>
                  )}
                  {detalle.sunatBajaTicket && (
                    <div className="space-y-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ticket</dt>
                      <dd className="break-all text-sm text-foreground">{detalle.sunatBajaTicket}</dd>
                    </div>
                  )}
                  {detalle.sunatBajaSolicitadaAt && (
                    <div className="space-y-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Solicitado</dt>
                      <dd className="text-sm text-foreground">
                        {formatFechaHora(detalle.sunatBajaSolicitadaAt)}
                      </dd>
                    </div>
                  )}
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
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-xs font-semibold uppercase tracking-wide text-white dark:bg-slate-700">
                        <th className="px-3 py-3 text-center">Cant</th>
                        <th className="px-3 py-3 text-left">Unidad</th>
                        <th className="px-3 py-3 text-left">Codigo</th>
                        <th className="px-3 py-3 text-left">Descripcion</th>
                        <th className="px-3 py-3 text-right">P. Unit</th>
                        <th className="px-3 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.detalles.length > 0 ? (
                        detalle.detalles.map((item) => (
                          <tr
                            key={item.idVentaDetalle}
                            className="border-b last:border-0 transition-colors hover:bg-muted/20"
                          >
                            <td className="px-3 py-3 text-center font-semibold text-foreground">
                              {item.cantidad.toFixed(2)}
                            </td>
                            <td className="px-3 py-3 font-medium text-foreground">
                              {item.unidadMedida}
                            </td>
                            <td className="px-3 py-3">
                              <span className="font-mono text-xs font-medium text-muted-foreground">
                                {item.sku || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <p className="font-semibold uppercase tracking-[0.01em] text-foreground">
                                {item.nombreProducto}
                              </p>
                              {(item.talla || item.color) ? (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {[item.talla, item.color].filter(Boolean).join(" · ")}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-blue-600 dark:text-blue-400">
                              {formatMonto(item.precioUnitario, detalle.moneda)}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-foreground">
                              {formatMonto(item.cantidad * item.precioUnitario, detalle.moneda)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-10 text-center text-sm text-muted-foreground"
                          >
                            No hay items registrados en este comprobante.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="border-t px-4 py-4">
                  <div className="ml-auto max-w-xs space-y-2 text-sm">
                    {detalle.descuentoTotal > 0 && (
                      <div className="flex items-center justify-between gap-8">
                        <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                          Descuentos (-)
                        </span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          -{formatMonto(detalle.descuentoTotal, detalle.moneda)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-8">
                      <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                        Subtotal
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatMonto(montoBruto, detalle.moneda)}
                      </span>
                    </div>

                    {showIgv ? (
                      <div className="flex items-center justify-between gap-8">
                        <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                          IGV ({detalle.igvPorcentaje.toFixed(2)}%)
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatMonto(detalle.igv, detalle.moneda)}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-8 rounded-lg bg-muted/50 px-3 py-2">
                      <span className="font-bold uppercase tracking-wide text-foreground">
                        Total
                      </span>
                      <span className="font-bold text-foreground">
                        {formatMonto(detalle.total, detalle.moneda)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="px-4 py-5 sm:px-4 sm:py-6">
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

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {showNotaCreditoButton && (
                  <button
                    type="button"
                    onClick={handleOpenNotaCredito}
                    disabled={disableVentaActions || anulandoVenta}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-1.5 sm:text-sm"
                  >
                    <DocumentTextIcon className="h-4 w-4 shrink-0" />
                    GENERAR NOTA DE CREDITO
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setAnularDialogOpen(true) }}
                  disabled={disableVentaActions || anulandoVenta}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-1.5 sm:text-sm"
                >
                  <ArrowPathIcon className={`h-4 w-4 shrink-0 ${anulandoVenta ? "animate-spin" : ""}`} />
                  {anulandoVenta
                    ? isSunatBaja ? "ENVIANDO BAJA..." : "ANULANDO..."
                    : isSunatBaja ? "DAR DE BAJA" : "ANULAR"}
                </button>
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
        detalle={detalle as VentaBajaInfo | null}
        isSubmitting={anulandoVenta}
        onOpenChange={setAnularDialogOpen}
        onConfirm={onAnularVenta}
      />
    </>
  )
}
