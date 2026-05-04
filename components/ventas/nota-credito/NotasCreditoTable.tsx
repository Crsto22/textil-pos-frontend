import Image from "next/image"
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline"

import { LoaderSpinner } from "@/components/ui/loader-spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  formatComprobante,
  formatFechaHora,
  formatMonto,
  getEstadoBadgeClass,
  getSunatBadgeClass,
  getSunatEstadoLabel,
  isSunatNotApplicable,
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
  onViewDetail: (notaCredito: NotaCreditoHistorial) => void
  onDownloadDocument: (
    notaCredito: NotaCreditoHistorial,
    kind: NotaCreditoDocumentKind
  ) => void
  onSolicitarBaja: (notaCredito: NotaCreditoHistorial) => void
  onConsultarBajaTicket: (notaCredito: NotaCreditoHistorial) => void
  downloadingDocument:
    | { idNotaCredito: number; kind: NotaCreditoDocumentKind }
    | null
  bajaAction:
    | { idNotaCredito: number; kind: "solicitar-baja" | "consultar-ticket" }
    | null
}

function SunatStatusBadge({ estado }: { estado: NotaCreditoHistorial["sunatEstado"] }) {
  const showSunatLogo = !isSunatNotApplicable(estado)

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getSunatBadgeClass(estado)}`}
    >
      {showSunatLogo ? (
        <Image
          src="/img/Sunat.png"
          alt="SUNAT"
          width={48}
          height={48}
          className="h-[48px] w-[48px] shrink-0 object-contain"
        />
      ) : null}
      {getSunatEstadoLabel(estado)}
    </span>
  )
}

const NOTA_CREDITO_ACTION_BLOCKED_ESTADOS = new Set([
  "ANULADA",
  "ANULADO",
  "ANULACION_PENDIENTE",
  "BAJA_ACEPTADA",
  "BAJA_ACEPTADO",
  "CANCELADA",
  "CANCELADO",
  "DADA_DE_BAJA",
  "DADO_DE_BAJA",
])

const SUNAT_BAJA_ACTIVE_ESTADOS = new Set([
  "PENDIENTE_ENVIO",
  "PENDIENTE_CDR",
  "ACEPTADO",
  "ACEPTADA",
  "OBSERVADO",
])

function normalizeValue(value: string | null | undefined): string {
  return value?.trim().toUpperCase() ?? ""
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
  onViewDetail,
  onDownloadDocument,
  onSolicitarBaja,
  onConsultarBajaTicket,
  downloadingDocument,
  bajaAction,
}: NotasCreditoTableProps) {
  const canGoPrev = page > 0
  const canGoNext = page + 1 < totalPages

  const isDownloading = (notaCreditoId: number, kind: NotaCreditoDocumentKind) =>
    downloadingDocument?.idNotaCredito === notaCreditoId && downloadingDocument.kind === kind

  const isAnyDownloadActive = downloadingDocument !== null

  return (
    <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
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
                <td colSpan={11} className="px-3 py-14 text-center">
                  <LoaderSpinner text="Cargando notas de credito..." />
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
                  <td className="px-3 py-3 font-medium">{formatFechaHora(notaCredito.fecha)}</td>
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
                    <div className="flex flex-col items-center gap-1">
                      <SunatStatusBadge estado={notaCredito.sunatEstado} />
                      {notaCredito.sunatBajaEstado ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getSunatBadgeClass(notaCredito.sunatBajaEstado)}`}>
                          Baja: {getSunatEstadoLabel(notaCredito.sunatBajaEstado)}
                        </span>
                      ) : null}
                    </div>
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
                    <ActionButtons
                      notaCredito={notaCredito}
                      downloadingDocument={downloadingDocument}
                      bajaAction={bajaAction}
                      isAnyDownloadActive={isAnyDownloadActive}
                      isDownloading={isDownloading}
                      onViewDetail={onViewDetail}
                      onDownloadDocument={onDownloadDocument}
                      onSolicitarBaja={onSolicitarBaja}
                      onConsultarBajaTicket={onConsultarBajaTicket}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {loading ? (
          <article className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 dark:border-slate-700 dark:bg-slate-900/40">
            <LoaderSpinner text="Cargando notas de credito..." />
          </article>
        ) : notasCredito.length === 0 ? (
          <article className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            Sin notas de credito para los filtros seleccionados
          </article>
        ) : (
          notasCredito.map((notaCredito) => (
            <article
              key={notaCredito.idNotaCredito}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {notaCredito.nombreCliente || "Sin cliente"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatFechaHora(notaCredito.fecha)}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEstadoBadgeClass(notaCredito.estado)}`}
                >
                  {notaCredito.estado}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {formatComprobante(notaCredito)}
                </span>
                {notaCredito.stockDevuelto && (
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Stock devuelto
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Total
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatMonto(notaCredito.total, notaCredito.moneda)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Items
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {notaCredito.items} item(s)
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Referencia
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {notaCredito.numeroVentaReferencia || "Sin referencia"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {notaCredito.tipoComprobanteVentaReferencia || "Sin referencia"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Usuario
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {notaCredito.nombreUsuario || "Sin usuario"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {notaCredito.nombreSucursal || "Sin sucursal"}
                  </p>
                </div>
              </div>

              <div className="mt-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Motivo
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {notaCredito.codigoMotivo} -{" "}
                  {getNotaCreditoMotivoLabel(
                    notaCredito.codigoMotivo,
                    notaCredito.descripcionMotivo
                  )}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {notaCredito.descripcionMotivo || "Sin descripcion"}
                </p>
              </div>

              <div className="mt-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  SUNAT
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SunatStatusBadge estado={notaCredito.sunatEstado} />
                  {notaCredito.sunatBajaEstado ? (
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getSunatBadgeClass(notaCredito.sunatBajaEstado)}`}>
                      Baja: {getSunatEstadoLabel(notaCredito.sunatBajaEstado)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <ActionButtons
                  notaCredito={notaCredito}
                  downloadingDocument={downloadingDocument}
                  bajaAction={bajaAction}
                  isAnyDownloadActive={isAnyDownloadActive}
                  isDownloading={isDownloading}
                  onViewDetail={onViewDetail}
                  onDownloadDocument={onDownloadDocument}
                  onSolicitarBaja={onSolicitarBaja}
                  onConsultarBajaTicket={onConsultarBajaTicket}
                />
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/60">
        <p className="text-xs text-muted-foreground">
          {totalElements} notas de credito
          {totalPages > 0 && ` - Pagina ${page + 1} de ${totalPages}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => onPageChange(page - 1)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onPageChange(page + 1)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  )
}

interface ActionButtonsProps {
  notaCredito: NotaCreditoHistorial
  downloadingDocument:
    | { idNotaCredito: number; kind: NotaCreditoDocumentKind }
    | null
  bajaAction:
    | { idNotaCredito: number; kind: "solicitar-baja" | "consultar-ticket" }
    | null
  isAnyDownloadActive: boolean
  isDownloading: (notaCreditoId: number, kind: NotaCreditoDocumentKind) => boolean
  onViewDetail: (notaCredito: NotaCreditoHistorial) => void
  onDownloadDocument: (
    notaCredito: NotaCreditoHistorial,
    kind: NotaCreditoDocumentKind
  ) => void
  onSolicitarBaja: (notaCredito: NotaCreditoHistorial) => void
  onConsultarBajaTicket: (notaCredito: NotaCreditoHistorial) => void
}

function ActionButtons({
  notaCredito,
  downloadingDocument,
  bajaAction,
  isAnyDownloadActive,
  isDownloading,
  onViewDetail,
  onDownloadDocument,
  onSolicitarBaja,
  onConsultarBajaTicket,
}: ActionButtonsProps) {
  const normalizedEstado = normalizeValue(notaCredito.estado)
  const normalizedSunatEstado = normalizeValue(notaCredito.sunatEstado)
  const normalizedSunatBajaEstado = normalizeValue(notaCredito.sunatBajaEstado)
  const bajaActiva = SUNAT_BAJA_ACTIVE_ESTADOS.has(normalizedSunatBajaEstado)
  const notaBloqueada =
    NOTA_CREDITO_ACTION_BLOCKED_ESTADOS.has(normalizedEstado) || bajaActiva
  const canSolicitarBaja =
    normalizedEstado === "EMITIDA" &&
    ["ACEPTADO", "ACEPTADA", "OBSERVADO"].includes(normalizedSunatEstado) &&
    !notaBloqueada
  const canConsultarBajaTicket = [
    "PENDIENTE_ENVIO",
    "PENDIENTE_CDR",
    "ERROR",
    "ERROR_TRANSITORIO",
  ].includes(normalizedSunatBajaEstado)
  const canDownloadBajaXml = normalizedSunatBajaEstado !== ""
  const canDownloadBajaCdr = ["ACEPTADO", "ACEPTADA", "OBSERVADO"].includes(
    normalizedSunatBajaEstado
  )

  const isBajaBusy = bajaAction?.idNotaCredito === notaCredito.idNotaCredito
  const isBusy =
    downloadingDocument?.idNotaCredito === notaCredito.idNotaCredito || isBajaBusy

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isBusy ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <EllipsisVerticalIcon className="h-4 w-4" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          {notaCredito.tipoComprobante} {formatComprobante(notaCredito)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onViewDetail(notaCredito)}>
          <EyeIcon className="mr-2 h-4 w-4 text-slate-500" />
          Ver detalle
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            if (canSolicitarBaja) onSolicitarBaja(notaCredito)
          }}
          disabled={!canSolicitarBaja || bajaAction !== null}
          className="text-rose-700 focus:text-rose-700 dark:text-rose-400"
        >
          {bajaAction?.idNotaCredito === notaCredito.idNotaCredito &&
          bajaAction.kind === "solicitar-baja" ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <NoSymbolIcon className="mr-2 h-4 w-4" />
          )}
          Solicitar Baja SUNAT
        </DropdownMenuItem>

        {canConsultarBajaTicket ? (
          <DropdownMenuItem
            onClick={() => onConsultarBajaTicket(notaCredito)}
            disabled={bajaAction !== null}
            className="text-cyan-700 focus:text-cyan-700 dark:text-cyan-400"
          >
            {bajaAction?.idNotaCredito === notaCredito.idNotaCredito &&
            bajaAction.kind === "consultar-ticket" ? (
              <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowPathIcon className="mr-2 h-4 w-4" />
            )}
            Consultar ticket baja
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
          Documentos
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => onDownloadDocument(notaCredito, "pdf")}
          disabled={isAnyDownloadActive}
          className="text-rose-700 focus:text-rose-700 dark:text-rose-400"
        >
          {isDownloading(notaCredito.idNotaCredito, "pdf") ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
          )}
          Descargar PDF
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDownloadDocument(notaCredito, "xml")}
          disabled={isAnyDownloadActive}
          className="text-emerald-700 focus:text-emerald-700 dark:text-emerald-400"
        >
          {isDownloading(notaCredito.idNotaCredito, "xml") ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CodeBracketIcon className="mr-2 h-4 w-4" />
          )}
          Descargar XML
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDownloadDocument(notaCredito, "cdr-xml")}
          disabled={isAnyDownloadActive}
          className="text-blue-700 focus:text-blue-700 dark:text-blue-400"
        >
          {isDownloading(notaCredito.idNotaCredito, "cdr-xml") ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DocumentTextIcon className="mr-2 h-4 w-4" />
          )}
          Ver CDR
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDownloadDocument(notaCredito, "cdr-zip")}
          disabled={isAnyDownloadActive}
          className="text-indigo-700 focus:text-indigo-700 dark:text-indigo-400"
        >
          {isDownloading(notaCredito.idNotaCredito, "cdr-zip") ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
          )}
          Descargar CDR
        </DropdownMenuItem>

        {(canDownloadBajaXml || canDownloadBajaCdr) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
              Baja SUNAT
            </DropdownMenuLabel>

            {canDownloadBajaXml ? (
              <DropdownMenuItem
                onClick={() => onDownloadDocument(notaCredito, "baja-xml")}
                disabled={isAnyDownloadActive}
                className="text-orange-700 focus:text-orange-700 dark:text-orange-400"
              >
                {isDownloading(notaCredito.idNotaCredito, "baja-xml") ? (
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
                )}
                XML de baja
              </DropdownMenuItem>
            ) : null}

            {canDownloadBajaCdr ? (
              <DropdownMenuItem
                onClick={() => onDownloadDocument(notaCredito, "baja-cdr")}
                disabled={isAnyDownloadActive}
                className="text-purple-700 focus:text-purple-700 dark:text-purple-400"
              >
                {isDownloading(notaCredito.idNotaCredito, "baja-cdr") ? (
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
                )}
                CDR de baja
              </DropdownMenuItem>
            ) : null}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
