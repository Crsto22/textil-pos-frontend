"use client"

import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  CodeBracketIcon,
  CubeIcon,
  DocumentTextIcon,
  NoSymbolIcon,
  UserIcon,
} from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { useState, type ComponentType } from "react"
import { toast } from "sonner"

import { LoaderSpinner } from "@/components/ui/loader-spinner"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  downloadNotaCreditoDocument,
  getNotaCreditoDownloadConfig,
  type NotaCreditoDocumentKind,
} from "@/lib/nota-credito-documents"
import type {
  NotaCreditoBajaInfo,
  NotaCreditoBajaRequest,
  NotaCreditoBajaResult,
  NotaCreditoDetalleResponse,
} from "@/lib/types/nota-credito"
import {
  formatComprobante,
  formatFechaHora,
  formatMonto,
  getEstadoBadgeClass,
  getSunatBadgeClass,
  getSunatEstadoLabel,
  normalizeSunatEstado,
} from "@/components/ventas/historial/historial.utils"

import { AnularNotaCreditoDialog } from "./AnularNotaCreditoDialog"

interface NotaCreditoDetalleContentProps {
  detalle: NotaCreditoDetalleResponse | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

function canDownloadSunatDocuments(estado: string | null | undefined): boolean {
  const normalized = normalizeSunatEstado(estado)
  return normalized === "ACEPTADO" || normalized === "ACEPTADA" || normalized === "OBSERVADO"
}

function DetailMetaItem({
  icon: Icon,
  label,
  value,
  secondary,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  secondary?: string
}) {
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

export function NotaCreditoDetalleContent({
  detalle,
  loading,
  error,
  onRetry,
}: NotaCreditoDetalleContentProps) {
  const router = useRouter()
  const [downloadingKind, setDownloadingKind] = useState<NotaCreditoDocumentKind | null>(null)
  const [expandedSunatMeta, setExpandedSunatMeta] = useState(false)
  const [bajaDialogOpen, setBajaDialogOpen] = useState(false)
  const [enviandoBaja, setEnviandoBaja] = useState(false)
  const [consultandoTicket, setConsultandoTicket] = useState(false)

  const bajaInfo: NotaCreditoBajaInfo | null = detalle
    ? {
        idNotaCredito: detalle.idNotaCredito,
        tipoComprobante: detalle.tipoComprobante,
        serie: detalle.serie,
        correlativo: detalle.correlativo,
        nombreCliente: detalle.nombreCliente,
        moneda: detalle.moneda,
        total: detalle.total,
      }
    : null

  const sunatBajaEstadoNorm = detalle?.sunatBajaEstado?.trim().toUpperCase() ?? ""
  const showSunatDownloads = detalle ? canDownloadSunatDocuments(detalle.sunatEstado) : false
  const showBajaXml = sunatBajaEstadoNorm !== ""
  const showBajaCdr = ["ACEPTADO", "ACEPTADA", "OBSERVADO"].includes(sunatBajaEstadoNorm)
  const canSolicitarBaja =
    detalle?.estado.trim().toUpperCase() === "EMITIDA" &&
    showSunatDownloads &&
    !showBajaXml
  const canConsultarTicket = [
    "PENDIENTE_ENVIO",
    "PENDIENTE_CDR",
    "ERROR",
    "ERROR_TRANSITORIO",
  ].includes(sunatBajaEstadoNorm)

  const handleDocumentAction = async (kind: NotaCreditoDocumentKind) => {
    if (!detalle || downloadingKind) return
    setDownloadingKind(kind)
    const result = await downloadNotaCreditoDocument(
      getNotaCreditoDownloadConfig(kind, { idNotaCredito: detalle.idNotaCredito })
    )
    setDownloadingKind(null)
    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const handleConfirmBaja = async (
    payload: NotaCreditoBajaRequest
  ): Promise<NotaCreditoBajaResult> => {
    if (!detalle) return { ok: false, message: "No hay nota seleccionada", response: null }
    setEnviandoBaja(true)
    try {
      const response = await authFetch(`/api/nota-credito/${detalle.idNotaCredito}/sunat/baja`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        return {
          ok: false,
          message:
            (typeof data?.message === "string" && data.message) ||
            "No se pudo solicitar la baja de la nota de credito",
          response: null,
        }
      }
      onRetry()
      return {
        ok: true,
        message:
          (typeof data?.message === "string" && data.message) ||
          "Solicitud de baja registrada correctamente",
        response: data,
      }
    } catch (requestError) {
      return {
        ok: false,
        message:
          requestError instanceof Error
            ? requestError.message
            : "No se pudo solicitar la baja de la nota de credito",
        response: null,
      }
    } finally {
      setEnviandoBaja(false)
    }
  }

  const handleConsultarTicket = async () => {
    if (!detalle || consultandoTicket) return
    setConsultandoTicket(true)
    try {
      const response = await authFetch(
        `/api/nota-credito/${detalle.idNotaCredito}/sunat/baja/consultar-ticket`,
        { method: "POST" }
      )
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(
          (typeof data?.message === "string" && data.message) ||
            "No se pudo consultar el ticket de baja"
        )
        return
      }
      toast.success(
        (typeof data?.message === "string" && data.message) ||
          "Consulta de ticket ejecutada correctamente"
      )
      onRetry()
    } catch {
      toast.error("Error de conexion al consultar el ticket de baja")
    } finally {
      setConsultandoTicket(false)
    }
  }

  const isDownloadingPdf = downloadingKind === "pdf"
  const isDownloadingXml = downloadingKind === "xml"
  const isDownloadingCdrXml = downloadingKind === "cdr-xml"
  const isDownloadingCdrZip = downloadingKind === "cdr-zip"
  const isDownloadingBajaXml = downloadingKind === "baja-xml"
  const isDownloadingBajaCdr = downloadingKind === "baja-cdr"

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            &larr; Volver
          </button>
          <h2 className="text-lg font-semibold">Detalle de nota de credito</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border bg-card px-4 py-12 shadow-sm">
            <LoaderSpinner text="Cargando detalle de nota de credito..." />
          </div>
        ) : null}

        {!loading && error ? (
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
        ) : null}

        {!loading && !error && detalle ? (
          <article className="w-full overflow-hidden rounded-2xl border bg-card shadow-sm">
            <header className="border-b border-border/60 px-4 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getEstadoBadgeClass(detalle.estado)}`}>
                      {detalle.estado}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSunatBadgeClass(detalle.sunatEstado)}`}>
                      SUNAT {getSunatEstadoLabel(detalle.sunatEstado)}
                    </span>
                    {detalle.sunatBajaEstado ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSunatBadgeClass(detalle.sunatBajaEstado)}`}>
                        BAJA {getSunatEstadoLabel(detalle.sunatBajaEstado)}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">
                    {detalle.tipoComprobante}{" "}
                    <span className="font-light text-muted-foreground">
                      {detalle.numeroNotaCredito || formatComprobante(detalle)}
                    </span>
                  </h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Emitido el {formatFechaHora(detalle.fecha)}
                  </p>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Monto total
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                    {formatMonto(detalle.total, detalle.moneda)}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-border/60 pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Documentos
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                  {showSunatDownloads ? (
                    <>
                      <button type="button" onClick={() => { void handleDocumentAction("xml") }} disabled={downloadingKind !== null} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5">
                        {isDownloadingXml ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CodeBracketIcon className="h-4 w-4" />}
                        <span>{isDownloadingXml ? "Descargando..." : "Descargar XML"}</span>
                      </button>
                      <button type="button" onClick={() => { void handleDocumentAction("cdr-xml") }} disabled={downloadingKind !== null} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5">
                        {isDownloadingCdrXml ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <DocumentTextIcon className="h-4 w-4" />}
                        <span>{isDownloadingCdrXml ? "Descargando..." : "Ver CDR"}</span>
                      </button>
                      <button type="button" onClick={() => { void handleDocumentAction("cdr-zip") }} disabled={downloadingKind !== null} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5">
                        {isDownloadingCdrZip ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
                        <span>{isDownloadingCdrZip ? "Descargando..." : "Descargar CDR"}</span>
                      </button>
                    </>
                  ) : null}
                  <button type="button" onClick={() => { void handleDocumentAction("pdf") }} disabled={downloadingKind !== null} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5">
                    {isDownloadingPdf ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
                    <span>{isDownloadingPdf ? "Descargando..." : "Descargar PDF"}</span>
                  </button>
                  {canSolicitarBaja ? (
                    <button type="button" onClick={() => setBajaDialogOpen(true)} disabled={enviandoBaja} className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5">
                      <NoSymbolIcon className="h-4 w-4" />
                      <span>Solicitar Baja SUNAT</span>
                    </button>
                  ) : null}
                  {canConsultarTicket ? (
                    <button type="button" onClick={() => { void handleConsultarTicket() }} disabled={consultandoTicket} className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-700/50 dark:bg-cyan-900/20 dark:text-cyan-300 sm:py-1.5">
                      <ArrowPathIcon className={`h-4 w-4 ${consultandoTicket ? "animate-spin" : ""}`} />
                      <span>{consultandoTicket ? "Consultando..." : "Consultar ticket baja"}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {(showBajaXml || showBajaCdr) ? (
                <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-3 dark:border-orange-900/40 dark:bg-orange-950/20">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-400">
                    Documentos de baja SUNAT
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                    {showBajaXml ? (
                      <button type="button" onClick={() => { void handleDocumentAction("baja-xml") }} disabled={downloadingKind !== null} className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5">
                        {isDownloadingBajaXml ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
                        <span>{isDownloadingBajaXml ? "Descargando..." : "XML de baja"}</span>
                      </button>
                    ) : null}
                    {showBajaCdr ? (
                      <button type="button" onClick={() => { void handleDocumentAction("baja-cdr") }} disabled={downloadingKind !== null} className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60 sm:py-1.5">
                        {isDownloadingBajaCdr ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
                        <span>{isDownloadingBajaCdr ? "Descargando..." : "CDR de baja"}</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </header>

            <section className="border-b border-border/60 px-4 py-5 sm:px-8">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DetailMetaItem icon={UserIcon} label="Cliente" value={detalle.nombreCliente} secondary={[detalle.tipoDocumentoCliente, detalle.nroDocumentoCliente].filter(Boolean).join(" ") || undefined} />
                <DetailMetaItem icon={DocumentTextIcon} label="Referencia" value={detalle.numeroVentaReferencia || detalle.numeroDocumentoReferencia || "-"} secondary={detalle.tipoComprobanteVentaReferencia || undefined} />
                <DetailMetaItem icon={UserIcon} label="Usuario" value={detalle.nombreUsuario} secondary={`Nota #${detalle.idNotaCredito}`} />
                <DetailMetaItem icon={BuildingOffice2Icon} label="Sucursal" value={detalle.nombreSucursal} secondary={detalle.nombreEmpresa || undefined} />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Motivo</p>
                  <p className="mt-1 text-sm font-semibold">{detalle.codigoMotivo} - {detalle.descripcionMotivo}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Subtotal / IGV</p>
                  <p className="mt-1 text-sm font-semibold">{formatMonto(detalle.subtotal, detalle.moneda)} / {formatMonto(detalle.igv, detalle.moneda)}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Stock</p>
                  <p className="mt-1 text-sm font-semibold">{detalle.stockDevuelto ? "Stock devuelto" : "Sin devolucion de stock"}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-border/60 pt-4">
                <button type="button" onClick={() => setExpandedSunatMeta((current) => !current)} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground">
                  {expandedSunatMeta ? "Ocultar detalles SUNAT" : "Ver detalles SUNAT"}
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedSunatMeta ? "rotate-180" : ""}`} />
                </button>
              </div>
            </section>

            {expandedSunatMeta ? (
              <section className="border-b border-border/60 bg-muted/30 px-6 py-5 sm:px-8">
                <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Mensaje SUNAT", detalle.sunatMensaje || "Sin mensaje"],
                    ["Hash", detalle.sunatHash || "-"],
                    ["XML", detalle.sunatXmlNombre || detalle.sunatZipNombre || "-"],
                    ["CDR", detalle.sunatCdrNombre || "-"],
                    ["Codigo", detalle.sunatCodigo || "-"],
                    ["Ticket", detalle.sunatTicket || "-"],
                    ["Enviado", detalle.sunatEnviadoAt ? formatFechaHora(detalle.sunatEnviadoAt) : "-"],
                    ["Respondido", detalle.sunatRespondidoAt ? formatFechaHora(detalle.sunatRespondidoAt) : "-"],
                  ].map(([label, value]) => (
                    <div key={label} className="space-y-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
                      <dd className="break-all text-sm text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {detalle.sunatBajaEstado ? (
              <section className="border-b border-border/60 bg-rose-50/40 px-6 py-5 dark:bg-rose-950/20 sm:px-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-400">
                  Estado de Baja SUNAT
                </p>
                <dl className="grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Estado", getSunatEstadoLabel(detalle.sunatBajaEstado)],
                    ["Mensaje", detalle.sunatBajaMensaje || "-"],
                    ["Ticket", detalle.sunatBajaTicket || "-"],
                    ["Tipo", detalle.sunatBajaTipo || "-"],
                    ["Lote", detalle.sunatBajaLote || String(detalle.sunatBajaLoteId ?? "-")],
                    ["Solicitado", detalle.sunatBajaSolicitadaAt ? formatFechaHora(detalle.sunatBajaSolicitadaAt) : "-"],
                    ["Respondido", detalle.sunatBajaRespondidaAt ? formatFechaHora(detalle.sunatBajaRespondidaAt) : "-"],
                  ].map(([label, value]) => (
                    <div key={label} className="space-y-1">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
                      <dd className="break-all text-sm text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section className="px-2 py-6 sm:px-4">
              <div className="mb-5 flex items-center gap-2">
                <CubeIcon className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-lg font-semibold tracking-tight text-foreground">
                  Resumen de productos
                </h4>
              </div>
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
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
                          <tr key={item.idNotaCreditoDetalle} className="border-b last:border-0 transition-colors hover:bg-muted/20">
                            <td className="px-3 py-3 text-center font-semibold">{item.cantidad}</td>
                            <td className="px-3 py-3">{item.unidadMedida}</td>
                            <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{item.sku || "-"}</td>
                            <td className="px-3 py-3">
                              <p className="font-semibold">{item.nombreProducto}</p>
                              <p className="text-xs text-muted-foreground">{item.descripcion}</p>
                              <p className="text-[11px] text-muted-foreground">Color: {item.color || "-"} / Talla: {item.talla || "-"}</p>
                            </td>
                            <td className="px-3 py-3 text-right">{formatMonto(item.precioUnitario, detalle.moneda)}</td>
                            <td className="px-3 py-3 text-right font-semibold">{formatMonto(item.totalDetalle, detalle.moneda)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                            Esta nota de credito no tiene productos registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </article>
        ) : null}
      </div>

      <AnularNotaCreditoDialog
        open={bajaDialogOpen}
        detalle={bajaInfo}
        isSubmitting={enviandoBaja}
        onOpenChange={setBajaDialogOpen}
        onConfirm={handleConfirmBaja}
      />
    </>
  )
}
