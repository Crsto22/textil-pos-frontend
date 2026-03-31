import Image from "next/image"
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CodeBracketIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline"

import {
  formatComprobante,
  formatFechaHora,
  formatMonto,
  getEstadoBadgeClass,
  getSunatBadgeClass,
} from "@/components/ventas/historial/historial.utils"
import { getNotaCreditoMotivoLabel } from "@/lib/nota-credito"
import type { NotaCreditoDocumentKind } from "@/lib/nota-credito-documents"
import type { NotaCreditoHistorial } from "@/lib/types/nota-credito"

interface NotasCreditoTableProps {
  notasCredito: NotaCreditoHistorial[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalElements: number
  onRetry: () => void
  onPageChange: (nextPage: number) => void
  onDownloadDocument: (
    notaCredito: NotaCreditoHistorial,
    kind: NotaCreditoDocumentKind
  ) => void
  downloadingDocument:
    | { idNotaCredito: number; kind: NotaCreditoDocumentKind }
    | null
}

function SunatStatusBadge({ estado }: { estado: NotaCreditoHistorial["sunatEstado"] }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 text-xs font-semibold ${getSunatBadgeClass(estado)}`}
    >
      <Image
        src="/img/Sunat.png"
        alt="SUNAT"
        width={48}
        height={48}
        className="h-[48px] w-[48px] shrink-0 object-contain"
      />
      {estado || "N/A"}
    </span>
  )
}

export function NotasCreditoTable({
  notasCredito,
  loading,
  error,
  page,
  totalPages,
  totalElements,
  onRetry,
  onPageChange,
  onDownloadDocument,
  downloadingDocument,
}: NotasCreditoTableProps) {
  const canGoPrev = page > 0
  const canGoNext = page + 1 < totalPages

  const isDownloading = (
    notaCreditoId: number,
    kind: NotaCreditoDocumentKind
  ) =>
    downloadingDocument?.idNotaCredito === notaCreditoId &&
    downloadingDocument.kind === kind

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold hover:bg-rose-100 dark:border-rose-700 dark:hover:bg-rose-900/40"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1220px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3 text-left">Fecha</th>
              <th className="px-3 py-3 text-left">Nota</th>
              <th className="px-3 py-3 text-left">Cliente</th>
              <th className="px-3 py-3 text-left">Referencia</th>
              <th className="px-3 py-3 text-left">Motivo</th>
              <th className="px-3 py-3 text-left">Usuario</th>
              <th className="px-3 py-3 text-center">SUNAT</th>
              <th className="px-3 py-3 text-center">Items</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-center">Estado</th>
              <th className="px-3 py-3 text-center">Accion</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="px-3 py-14 text-center text-sm text-muted-foreground">
                  Cargando notas de credito...
                </td>
              </tr>
            ) : notasCredito.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-14 text-center text-sm text-muted-foreground">
                  Sin notas de credito para los filtros seleccionados
                </td>
              </tr>
            ) : (
              notasCredito.map((notaCredito) => (
                <tr
                  key={notaCredito.idNotaCredito}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="px-3 py-3 font-medium">
                    {formatFechaHora(notaCredito.fecha)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold">{notaCredito.tipoComprobante}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatComprobante(notaCredito)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-medium">
                    {notaCredito.nombreCliente || "Sin cliente"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {notaCredito.tipoComprobanteVentaReferencia || "Sin referencia"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {notaCredito.numeroVentaReferencia || "Sin referencia"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {notaCredito.codigoMotivo} -{" "}
                        {getNotaCreditoMotivoLabel(
                          notaCredito.codigoMotivo,
                          notaCredito.descripcionMotivo
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {notaCredito.descripcionMotivo || "Sin descripcion"}
                      </span>
                      {notaCredito.stockDevuelto && (
                        <span className="inline-flex w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Stock devuelto
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {notaCredito.nombreUsuario || "Sin usuario"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {notaCredito.nombreSucursal || "Sin sucursal"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <SunatStatusBadge estado={notaCredito.sunatEstado} />
                  </td>
                  <td className="px-3 py-3 text-center font-semibold">{notaCredito.items}</td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {formatMonto(notaCredito.total, notaCredito.moneda)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoBadgeClass(notaCredito.estado)}`}
                    >
                      {notaCredito.estado}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Descargar PDF"
                        aria-label={`Descargar PDF de la nota ${formatComprobante(notaCredito)}`}
                        onClick={() => onDownloadDocument(notaCredito, "pdf")}
                        disabled={downloadingDocument !== null}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/35"
                      >
                        {isDownloading(notaCredito.idNotaCredito, "pdf") ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Descargar XML"
                        aria-label={`Descargar XML de la nota ${formatComprobante(notaCredito)}`}
                        onClick={() => onDownloadDocument(notaCredito, "xml")}
                        disabled={downloadingDocument !== null}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35"
                      >
                        {isDownloading(notaCredito.idNotaCredito, "xml") ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <CodeBracketIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Ver CDR (XML)"
                        aria-label={`Ver CDR XML de la nota ${formatComprobante(notaCredito)}`}
                        onClick={() => onDownloadDocument(notaCredito, "cdr-xml")}
                        disabled={downloadingDocument !== null}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                      >
                        {isDownloading(notaCredito.idNotaCredito, "cdr-xml") ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Descargar CDR (ZIP)"
                        aria-label={`Descargar CDR ZIP de la nota ${formatComprobante(notaCredito)}`}
                        onClick={() => onDownloadDocument(notaCredito, "cdr-zip")}
                        disabled={downloadingDocument !== null}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-700/50 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/35"
                      >
                        {isDownloading(notaCredito.idNotaCredito, "cdr-zip") ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {loading ? (
          <article className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
            Cargando notas de credito...
          </article>
        ) : notasCredito.length === 0 ? (
          <article className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
            Sin notas de credito para los filtros seleccionados
          </article>
        ) : (
          notasCredito.map((notaCredito) => (
            <article key={notaCredito.idNotaCredito} className="rounded-xl border bg-background p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {formatComprobante(notaCredito)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFechaHora(notaCredito.fecha)}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEstadoBadgeClass(notaCredito.estado)}`}
                >
                  {notaCredito.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{notaCredito.nombreCliente || "Sin cliente"}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">
                    {formatMonto(notaCredito.total, notaCredito.moneda)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Referencia</p>
                  <p className="font-semibold">
                    {notaCredito.numeroVentaReferencia || "Sin referencia"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {notaCredito.tipoComprobanteVentaReferencia || "Sin referencia"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Motivo</p>
                  <p className="font-semibold">
                    {notaCredito.codigoMotivo} -{" "}
                    {getNotaCreditoMotivoLabel(
                      notaCredito.codigoMotivo,
                      notaCredito.descripcionMotivo
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Items</p>
                  <p className="font-semibold">{notaCredito.items}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Image
                      src="/img/Sunat.png"
                      alt="SUNAT"
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] shrink-0 object-contain"
                    />
                    <p>SUNAT</p>
                  </div>
                  <div className="mt-1">
                    <SunatStatusBadge estado={notaCredito.sunatEstado} />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  title="Descargar PDF"
                  aria-label={`Descargar PDF de la nota ${formatComprobante(notaCredito)}`}
                  onClick={() => onDownloadDocument(notaCredito, "pdf")}
                  disabled={downloadingDocument !== null}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/35"
                >
                  {isDownloading(notaCredito.idNotaCredito, "pdf") ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  title="Descargar XML"
                  aria-label={`Descargar XML de la nota ${formatComprobante(notaCredito)}`}
                  onClick={() => onDownloadDocument(notaCredito, "xml")}
                  disabled={downloadingDocument !== null}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35"
                >
                  {isDownloading(notaCredito.idNotaCredito, "xml") ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <CodeBracketIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  title="Ver CDR (XML)"
                  aria-label={`Ver CDR XML de la nota ${formatComprobante(notaCredito)}`}
                  onClick={() => onDownloadDocument(notaCredito, "cdr-xml")}
                  disabled={downloadingDocument !== null}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                >
                  {isDownloading(notaCredito.idNotaCredito, "cdr-xml") ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  title="Descargar CDR (ZIP)"
                  aria-label={`Descargar CDR ZIP de la nota ${formatComprobante(notaCredito)}`}
                  onClick={() => onDownloadDocument(notaCredito, "cdr-zip")}
                  disabled={downloadingDocument !== null}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-700/50 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/35"
                >
                  {isDownloading(notaCredito.idNotaCredito, "cdr-zip") ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <p className="text-xs text-muted-foreground">
          {totalElements} notas de credito
          {totalPages > 0 && ` - Pagina ${page + 1} de ${totalPages}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  )
}
