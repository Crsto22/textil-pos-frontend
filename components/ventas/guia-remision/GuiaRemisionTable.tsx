import Image from "next/image"
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline"
import { LoaderSpinner } from "@/components/ui/loader-spinner"

import {
  formatFechaHora,
  getEstadoBadgeClass,
  getSunatBadgeClass,
  getSunatEstadoLabel,
  isSunatNotApplicable,
  normalizeSunatEstado,
} from "@/components/ventas/historial/historial.utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MODALIDAD_TRANSPORTE_LABELS } from "@/lib/types/guia-remision"
import type { GuiaRemisionListItem } from "@/lib/types/guia-remision"

export type GuiaDocumentKind = "pdf" | "xml" | "cdr-xml" | "cdr-zip"

interface GuiaRemisionTableProps {
  guias: GuiaRemisionListItem[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalElements: number
  onRetry: () => void
  onPageChange: (nextPage: number) => void
  onViewDetail: (guia: GuiaRemisionListItem) => void
  onEmitir: (guia: GuiaRemisionListItem) => void
  emitiendo: number | null
  onConsultarCdr: (guia: GuiaRemisionListItem) => void
  consultandoCdr: number | null
  onDownloadDocument: (guia: GuiaRemisionListItem, kind: GuiaDocumentKind) => void
  downloadingDocument: {
    idGuiaRemision: number
    kind: GuiaDocumentKind
  } | null
}

function isSunatAcceptedWithCdr(estado: string | null | undefined): boolean {
  const normalized = normalizeSunatEstado(estado)
  return normalized === "ACEPTADO" || normalized === "ACEPTADA" || normalized === "OBSERVADO"
}

function getGuiaSunatEstadoLabel(estado: string | null | undefined): string {
  return normalizeSunatEstado(estado) === "OBSERVADO"
    ? "Aceptada por SUNAT con observacion"
    : getSunatEstadoLabel(estado)
}

function getGuiaEstadoLabel(guia: GuiaRemisionListItem): string {
  const estado = guia.estado?.trim().toUpperCase() || ""
  if (estado === "EMITIDA" && normalizeSunatEstado(guia.sunatEstado) === "OBSERVADO") {
    return "ACEPTADA / OBSERVADA"
  }
  return guia.estado
}

function getGuiaEstadoBadgeClass(guia: GuiaRemisionListItem): string {
  const estado = guia.estado?.trim().toUpperCase() || ""
  return getEstadoBadgeClass(
    estado === "EMITIDA" && normalizeSunatEstado(guia.sunatEstado) === "OBSERVADO"
      ? "ACEPTADA"
      : guia.estado
  )
}

function SunatStatusBadge({ estado }: { estado: string | null }) {
  const showSunatLogo = !isSunatNotApplicable(estado)

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getSunatBadgeClass(estado)}`}
    >
      {showSunatLogo ? (
        <Image
          src="/img/Sunat.png"
          alt="SUNAT"
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 object-contain"
        />
      ) : null}
      {getGuiaSunatEstadoLabel(estado)}
    </span>
  )
}

function formatNumeroGuia(guia: GuiaRemisionListItem) {
  if (guia.numeroGuiaRemision) return guia.numeroGuiaRemision
  const serie = guia.serie?.trim() || "-"
  const correlativo = Number.isFinite(guia.correlativo) ? guia.correlativo : 0
  return `${serie}-${String(correlativo).padStart(8, "0")}`
}

function formatRuta(guia: GuiaRemisionListItem) {
  const partida =
    guia.nombreSucursalPartida || guia.direccionPartida || guia.ubigeoPartida || "-"
  const llegada =
    guia.nombreSucursalLlegada || guia.direccionLlegada || guia.ubigeoLlegada || "-"
  return { partida, llegada }
}

function formatPeso(guia: GuiaRemisionListItem) {
  const peso = Number.isFinite(guia.pesoBrutoTotal) ? guia.pesoBrutoTotal : 0
  return `${peso} ${guia.unidadPeso || "KGM"}`
}

export function GuiaRemisionTable({
  guias,
  loading,
  error,
  page,
  totalPages,
  totalElements,
  onRetry,
  onPageChange,
  onViewDetail,
  onEmitir,
  emitiendo,
  onConsultarCdr,
  consultandoCdr,
  onDownloadDocument,
  downloadingDocument,
}: GuiaRemisionTableProps) {
  const canGoPrev = page > 0
  const canGoNext = page + 1 < totalPages

  const isDownloading = (guiaId: number, kind: GuiaDocumentKind) =>
    downloadingDocument?.idGuiaRemision === guiaId &&
    downloadingDocument.kind === kind

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
      {error ? (
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
      ) : null}

      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1200px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3 text-left">Fecha emision</th>
              <th className="px-3 py-3 text-left">Numero</th>
              <th className="px-3 py-3 text-left">Destinatario</th>
              <th className="px-3 py-3 text-left">Ruta</th>
              <th className="px-3 py-3 text-left">Modalidad / Peso</th>
              <th className="px-3 py-3 text-center">SUNAT</th>
              <th className="px-3 py-3 text-center">Estado</th>
              <th className="px-3 py-3 text-center">Accion</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-14 text-center"
                >
                  <LoaderSpinner text="Cargando GRE remitente..." />
                </td>
              </tr>
            ) : guias.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-14 text-center text-sm text-muted-foreground"
                >
                  Sin GRE remitente para los filtros seleccionados
                </td>
              </tr>
            ) : (
              guias.map((guia) => {
                const ruta = formatRuta(guia)
                return (
                  <tr
                    key={guia.idGuiaRemision}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-3 py-3 font-medium">
                      {guia.fechaEmision ? formatFechaHora(guia.fechaEmision) : "-"}
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-semibold">{formatNumeroGuia(guia)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {guia.destinatarioRazonSocial || "Sin destinatario"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Doc: {guia.destinatarioNroDoc || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1 text-xs">
                        <p className="font-medium">Partida: {ruta.partida}</p>
                        <p className="text-muted-foreground">
                          Llegada: {ruta.llegada}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1 text-xs">
                        <p className="font-medium">
                          {MODALIDAD_TRANSPORTE_LABELS[guia.modalidadTransporte] ||
                            guia.modalidadTransporte}
                        </p>
                        <p className="text-muted-foreground">
                          {formatPeso(guia)}
                          {guia.numeroBultos != null ? ` | Bultos: ${guia.numeroBultos}` : ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="space-y-1">
                        <div className="flex justify-center">
                          <SunatStatusBadge estado={guia.sunatEstado} />
                        </div>
                        {guia.sunatCodigo || guia.sunatMensaje ? (
                          <p className="text-[11px] text-muted-foreground">
                            {[guia.sunatCodigo, guia.sunatMensaje]
                              .filter(Boolean)
                              .join(" - ")}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getGuiaEstadoBadgeClass(guia)}`}
                      >
                        {getGuiaEstadoLabel(guia)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <ActionButtons
                        guia={guia}
                        emitiendo={emitiendo}
                        consultandoCdr={consultandoCdr}
                        onEmitir={onEmitir}
                        onConsultarCdr={onConsultarCdr}
                        onViewDetail={onViewDetail}
                        onDownloadDocument={onDownloadDocument}
                        isDownloading={isDownloading}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:hidden">
        {loading ? (
          <article className="rounded-xl border p-6 flex items-center justify-center">
            <LoaderSpinner text="Cargando GRE remitente..." />
          </article>
        ) : guias.length === 0 ? (
          <article className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
            Sin GRE remitente para los filtros seleccionados
          </article>
        ) : (
          guias.map((guia) => {
            const ruta = formatRuta(guia)
            return (
              <article
                key={guia.idGuiaRemision}
                className="space-y-3 rounded-xl border bg-background p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{formatNumeroGuia(guia)}</p>
                    <p className="text-xs text-muted-foreground">
                      {guia.fechaEmision
                        ? formatFechaHora(guia.fechaEmision)
                        : "Sin fecha de emision"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getGuiaEstadoBadgeClass(guia)}`}
                  >
                    {getGuiaEstadoLabel(guia)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <InfoBlock
                    label="Destinatario"
                    value={guia.destinatarioRazonSocial || "Sin destinatario"}
                    hint={`Doc: ${guia.destinatarioNroDoc || "-"}`}
                  />
                  <InfoBlock
                    label="Modalidad"
                    value={
                      MODALIDAD_TRANSPORTE_LABELS[guia.modalidadTransporte] ||
                      guia.modalidadTransporte
                    }
                    hint={formatPeso(guia)}
                  />
                  <InfoBlock
                    label="Partida"
                    value={ruta.partida}
                    hint={guia.ubigeoPartida || "-"}
                  />
                  <InfoBlock
                    label="Llegada"
                    value={ruta.llegada}
                    hint={guia.ubigeoLlegada || "-"}
                  />
                </div>

                <div className="rounded-xl bg-muted/30 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Image
                      src="/img/Sunat.png"
                      alt="SUNAT"
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] shrink-0 object-contain"
                    />
                    <p className="text-xs font-medium text-muted-foreground">SUNAT</p>
                  </div>
                  <SunatStatusBadge estado={guia.sunatEstado} />
                  {guia.sunatCodigo || guia.sunatMensaje ? (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {[guia.sunatCodigo, guia.sunatMensaje].filter(Boolean).join(" - ")}
                    </p>
                  ) : null}
                </div>

                <div className="flex justify-end">
                  <ActionButtons
                    guia={guia}
                    emitiendo={emitiendo}
                    consultandoCdr={consultandoCdr}
                    onEmitir={onEmitir}
                    onConsultarCdr={onConsultarCdr}
                    onViewDetail={onViewDetail}
                    onDownloadDocument={onDownloadDocument}
                    isDownloading={isDownloading}
                  />
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <p className="text-xs text-muted-foreground">
          {totalElements} guia(s) de remision
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

function ActionButtons({
  guia,
  emitiendo,
  consultandoCdr,
  onEmitir,
  onConsultarCdr,
  onViewDetail,
  onDownloadDocument,
  isDownloading,
}: {
  guia: GuiaRemisionListItem
  emitiendo: number | null
  consultandoCdr: number | null
  onEmitir: (guia: GuiaRemisionListItem) => void
  onConsultarCdr: (guia: GuiaRemisionListItem) => void
  onViewDetail: (guia: GuiaRemisionListItem) => void
  onDownloadDocument: (guia: GuiaRemisionListItem, kind: GuiaDocumentKind) => void
  isDownloading: (guiaId: number, kind: GuiaDocumentKind) => boolean
}) {
  const sunatEstadoNorm = normalizeSunatEstado(guia.sunatEstado)
  const hasCdrFile = Boolean(guia.sunatCdrNombre?.trim())
  const hasCdrAvailable = hasCdrFile || isSunatAcceptedWithCdr(guia.sunatEstado)
  const canConsultarCdr =
    !hasCdrAvailable &&
    ["PENDIENTE", "PENDIENTE_CDR", "ERROR", "ERROR_TRANSITORIO"].includes(sunatEstadoNorm)

  const isBusy =
    emitiendo === guia.idGuiaRemision ||
    consultandoCdr === guia.idGuiaRemision ||
    isDownloading(guia.idGuiaRemision, "pdf") ||
    isDownloading(guia.idGuiaRemision, "xml") ||
    isDownloading(guia.idGuiaRemision, "cdr-xml") ||
    isDownloading(guia.idGuiaRemision, "cdr-zip")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isBusy ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <EllipsisVerticalIcon className="h-4 w-4" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          {guia.numeroGuiaRemision ?? `${guia.serie ?? "-"}-${String(guia.correlativo ?? 0).padStart(8, "0")}`}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onViewDetail(guia)}>
          <EyeIcon className="mr-2 h-4 w-4 text-slate-500" />
          Ver detalle
        </DropdownMenuItem>

        {guia.estado === "BORRADOR" && (
          <DropdownMenuItem
            onClick={() => onEmitir(guia)}
            disabled={emitiendo !== null}
            className="text-amber-700 focus:text-amber-700 dark:text-amber-400"
          >
            {emitiendo === guia.idGuiaRemision ? (
              <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PaperAirplaneIcon className="mr-2 h-4 w-4" />
            )}
            Emitir guia
          </DropdownMenuItem>
        )}

        {canConsultarCdr && (
          <DropdownMenuItem
            onClick={() => onConsultarCdr(guia)}
            disabled={consultandoCdr !== null}
            className="text-cyan-700 focus:text-cyan-700 dark:text-cyan-400"
          >
            {consultandoCdr === guia.idGuiaRemision ? (
              <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowPathIcon className="mr-2 h-4 w-4" />
            )}
            Consultar CDR
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
          Descargas
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => onDownloadDocument(guia, "pdf")}
          disabled={isDownloading(guia.idGuiaRemision, "pdf")}
          className="text-rose-700 focus:text-rose-700 dark:text-rose-400"
        >
          {isDownloading(guia.idGuiaRemision, "pdf") ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DocumentTextIcon className="mr-2 h-4 w-4" />
          )}
          Descargar PDF
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDownloadDocument(guia, "xml")}
          disabled={isDownloading(guia.idGuiaRemision, "xml")}
          className="text-emerald-700 focus:text-emerald-700 dark:text-emerald-400"
        >
          {isDownloading(guia.idGuiaRemision, "xml") ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CodeBracketIcon className="mr-2 h-4 w-4" />
          )}
          Descargar XML
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDownloadDocument(guia, "cdr-xml")}
          disabled={!hasCdrAvailable || isDownloading(guia.idGuiaRemision, "cdr-xml")}
          className="text-blue-700 focus:text-blue-700 dark:text-blue-400"
        >
          {isDownloading(guia.idGuiaRemision, "cdr-xml") ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
          )}
          CDR (XML)
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDownloadDocument(guia, "cdr-zip")}
          disabled={!hasCdrAvailable || isDownloading(guia.idGuiaRemision, "cdr-zip")}
          className="text-indigo-700 focus:text-indigo-700 dark:text-indigo-400"
        >
          {isDownloading(guia.idGuiaRemision, "cdr-zip") ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
          )}
          CDR (ZIP)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function InfoBlock({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</p>
      <p className="text-xs font-semibold leading-snug">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
