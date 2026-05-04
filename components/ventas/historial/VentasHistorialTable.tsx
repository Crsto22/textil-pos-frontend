import Image from "next/image"
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  NoSymbolIcon,
  TicketIcon,
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
import type { VentaHistorial } from "@/lib/types/venta"
import {
  formatComprobante,
  formatFechaHora,
  formatMonto,
  getEstadoBadgeClass,
  getSunatBadgeClass,
  getSunatEstadoLabel,
  isSunatNotApplicable,
} from "@/components/ventas/historial/historial.utils"

interface VentasHistorialTableProps {
  ventas: VentaHistorial[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalElements: number
  hideSunat?: boolean
  onRetry: () => void
  onPageChange: (nextPage: number) => void
  onViewDetail: (venta: VentaHistorial) => void
  onOpenPdf: (venta: VentaHistorial) => void
  onDownloadPdf: (venta: VentaHistorial) => void
  onOpenTicket: (venta: VentaHistorial) => void
  onGenerarNotaCredito: (venta: VentaHistorial) => void
  onDarDeBaja: (venta: VentaHistorial) => void
  onDownloadXml: (venta: VentaHistorial) => void
  onDownloadCdr: (venta: VentaHistorial) => void
  onDownloadBajaXml: (venta: VentaHistorial) => void
  onDownloadBajaCdr: (venta: VentaHistorial) => void
  openingPdfVentaId: number | null
  downloadingPdfVentaId: number | null
  openingTicketVentaId: number | null
  downloadingXmlVentaId: number | null
  downloadingCdrVentaId: number | null
  downloadingBajaXmlVentaId: number | null
  downloadingBajaCdrVentaId: number | null
}

function SunatStatusBadge({ estado }: { estado: VentaHistorial["sunatEstado"] }) {
  const showSunatLogo = !isSunatNotApplicable(estado)

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getSunatBadgeClass(estado)}`}
    >
      {showSunatLogo ? (
        <Image
          src="/img/Sunat.png"
          alt="SUNAT"
          width={18}
          height={18}
          className="h-[18px] w-[18px] shrink-0 object-contain"
        />
      ) : null}
      {getSunatEstadoLabel(estado)}
    </span>
  )
}

const VENTA_ACTION_BLOCKED_ESTADOS = new Set([
  "ANULADO",
  "ANULADA",
  "ANULACION_PENDIENTE",
  "BAJA_ACEPTADA",
  "BAJA_ACEPTADO",
  "CANCELADA",
  "CANCELADO",
  "DADA_DE_BAJA",
  "DADO_DE_BAJA",
  "NC_EMITIDA",
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

export function VentasHistorialTable({
  ventas,
  loading,
  error,
  page,
  totalPages,
  totalElements,
  hideSunat = false,
  onRetry,
  onPageChange,
  onViewDetail,
  onOpenPdf,
  onDownloadPdf,
  onOpenTicket,
  onGenerarNotaCredito,
  onDarDeBaja,
  onDownloadXml,
  onDownloadCdr,
  onDownloadBajaXml,
  onDownloadBajaCdr,
  openingPdfVentaId,
  downloadingPdfVentaId,
  openingTicketVentaId,
  downloadingXmlVentaId,
  downloadingCdrVentaId,
  downloadingBajaXmlVentaId,
  downloadingBajaCdrVentaId,
}: VentasHistorialTableProps) {
  const canGoPrev = page > 0
  const canGoNext = page + 1 < totalPages
  const colSpan = hideSunat ? 9 : 10

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
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3 text-left">Fecha</th>
              <th className="px-3 py-3 text-left">Comprobante</th>
              <th className="px-3 py-3 text-left">Cliente</th>
              <th className="px-3 py-3 text-left">Usuario</th>
              {!hideSunat && <th className="px-3 py-3 text-center">SUNAT</th>}
              <th className="px-3 py-3 text-center">Items</th>
              <th className="px-3 py-3 text-center">Pagos</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-center">Estado</th>
              <th className="px-3 py-3 text-center">Accion</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-14 text-center">
                  <LoaderSpinner text="Cargando ventas..." />
                </td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-14 text-center text-sm text-muted-foreground">
                  Sin ventas para los filtros seleccionados
                </td>
              </tr>
            ) : (
              ventas.map((venta) => (
                <tr key={venta.idVenta} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-3 font-medium">{formatFechaHora(venta.fecha)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold">{venta.tipoComprobante}</span>
                      <span className="text-xs text-muted-foreground">{formatComprobante(venta)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-medium">{venta.nombreCliente || "Sin cliente"}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {venta.nombreUsuario || "Sin usuario"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {venta.nombreSucursal || "Sin sucursal"}
                      </span>
                    </div>
                  </td>
                  {!hideSunat && (
                    <td className="px-3 py-3 text-center">
                      <SunatStatusBadge estado={venta.sunatEstado} />
                    </td>
                  )}
                  <td className="px-3 py-3 text-center font-semibold">{venta.items}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                      {venta.pagos}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {formatMonto(venta.total, venta.moneda)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoBadgeClass(venta.estado)}`}
                    >
                      {venta.estado}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ActionButtons
                      venta={venta}
                      hideSunat={hideSunat}
                      openingPdfVentaId={openingPdfVentaId}
                      downloadingPdfVentaId={downloadingPdfVentaId}
                      openingTicketVentaId={openingTicketVentaId}
                      downloadingXmlVentaId={downloadingXmlVentaId}
                      downloadingCdrVentaId={downloadingCdrVentaId}
                      downloadingBajaXmlVentaId={downloadingBajaXmlVentaId}
                      downloadingBajaCdrVentaId={downloadingBajaCdrVentaId}
                      onViewDetail={onViewDetail}
                      onOpenPdf={onOpenPdf}
                      onDownloadPdf={onDownloadPdf}
                      onOpenTicket={onOpenTicket}
                      onGenerarNotaCredito={onGenerarNotaCredito}
                      onDarDeBaja={onDarDeBaja}
                      onDownloadXml={onDownloadXml}
                      onDownloadCdr={onDownloadCdr}
                      onDownloadBajaXml={onDownloadBajaXml}
                      onDownloadBajaCdr={onDownloadBajaCdr}
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
            <LoaderSpinner text="Cargando ventas..." />
          </article>
        ) : ventas.length === 0 ? (
          <article className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            Sin ventas para los filtros seleccionados
          </article>
        ) : (
          ventas.map((venta) => (
            <div
              key={venta.idVenta}
              role="button"
              tabIndex={0}
              onClick={() => onViewDetail(venta)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onViewDetail(venta)
                }
              }}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-left transition hover:border-slate-200 hover:bg-white dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-900/70"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {venta.nombreCliente || "Sin cliente"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatFechaHora(venta.fecha)}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {venta.tipoComprobante}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEstadoBadgeClass(venta.estado)}`}
                    >
                      {venta.estado}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Comprobante
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatComprobante(venta)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Total
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatMonto(venta.total, venta.moneda)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Items y pagos
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {venta.items} item(s)
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {venta.pagos} pago(s)
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Usuario
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {venta.nombreUsuario || "Sin usuario"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {venta.nombreSucursal || "Sin sucursal"}
                  </p>
                </div>
              </div>

              {!hideSunat && (
                <div className="mt-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    SUNAT
                  </p>
                  <div className="mt-1">
                    <SunatStatusBadge estado={venta.sunatEstado} />
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onViewDetail(venta)
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                >
                  <EyeIcon className="h-4 w-4" />
                  Ver detalle
                </button>
                <ActionButtons
                  venta={venta}
                  hideSunat={hideSunat}
                  openingPdfVentaId={openingPdfVentaId}
                  downloadingPdfVentaId={downloadingPdfVentaId}
                  openingTicketVentaId={openingTicketVentaId}
                  downloadingXmlVentaId={downloadingXmlVentaId}
                  downloadingCdrVentaId={downloadingCdrVentaId}
                  downloadingBajaXmlVentaId={downloadingBajaXmlVentaId}
                  downloadingBajaCdrVentaId={downloadingBajaCdrVentaId}
                  onViewDetail={onViewDetail}
                  onOpenPdf={onOpenPdf}
                  onDownloadPdf={onDownloadPdf}
                  onOpenTicket={onOpenTicket}
                  onGenerarNotaCredito={onGenerarNotaCredito}
                  onDarDeBaja={onDarDeBaja}
                  onDownloadXml={onDownloadXml}
                  onDownloadCdr={onDownloadCdr}
                  onDownloadBajaXml={onDownloadBajaXml}
                  onDownloadBajaCdr={onDownloadBajaCdr}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/60">
        <p className="text-xs text-muted-foreground">
          {totalElements} ventas
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
  venta: VentaHistorial
  hideSunat?: boolean
  openingPdfVentaId: number | null
  downloadingPdfVentaId: number | null
  openingTicketVentaId: number | null
  downloadingXmlVentaId: number | null
  downloadingCdrVentaId: number | null
  downloadingBajaXmlVentaId: number | null
  downloadingBajaCdrVentaId: number | null
  onViewDetail: (venta: VentaHistorial) => void
  onOpenPdf: (venta: VentaHistorial) => void
  onDownloadPdf: (venta: VentaHistorial) => void
  onOpenTicket: (venta: VentaHistorial) => void
  onGenerarNotaCredito: (venta: VentaHistorial) => void
  onDarDeBaja: (venta: VentaHistorial) => void
  onDownloadXml: (venta: VentaHistorial) => void
  onDownloadCdr: (venta: VentaHistorial) => void
  onDownloadBajaXml: (venta: VentaHistorial) => void
  onDownloadBajaCdr: (venta: VentaHistorial) => void
}

function ActionButtons({
  venta,
  hideSunat = false,
  openingPdfVentaId,
  downloadingPdfVentaId,
  openingTicketVentaId,
  downloadingXmlVentaId,
  downloadingCdrVentaId,
  downloadingBajaXmlVentaId,
  downloadingBajaCdrVentaId,
  onViewDetail,
  onOpenPdf,
  onDownloadPdf,
  onOpenTicket,
  onGenerarNotaCredito,
  onDarDeBaja,
  onDownloadXml,
  onDownloadCdr,
  onDownloadBajaXml,
  onDownloadBajaCdr,
}: ActionButtonsProps) {
  const normalizedTipo = normalizeValue(venta.tipoComprobante)
  const normalizedEstado = normalizeValue(venta.estado)
  const normalizedSunatEstado = normalizeValue(venta.sunatEstado)
  const normalizedSunatBajaEstado = normalizeValue(venta.sunatBajaEstado)
  const isSunat = ["BOLETA", "FACTURA"].includes(normalizedTipo)
  const isNotaVenta = normalizedTipo === "NOTA DE VENTA"
  const canDownloadSunatDocs = isSunat && normalizedSunatEstado === "ACEPTADO"
  const sunatBajaPendienteOAceptada = SUNAT_BAJA_ACTIVE_ESTADOS.has(normalizedSunatBajaEstado)
  const ventaActionBlocked =
    VENTA_ACTION_BLOCKED_ESTADOS.has(normalizedEstado) || sunatBajaPendienteOAceptada
  const canGenerarNotaCredito =
    isSunat && normalizedEstado === "EMITIDA" && !ventaActionBlocked
  const canDarDeBajaSunat =
    isSunat &&
    normalizedEstado === "EMITIDA" &&
    ["ACEPTADO", "OBSERVADO"].includes(normalizedSunatEstado) &&
    !ventaActionBlocked
  const canDarDeBajaInternal =
    isNotaVenta && normalizedEstado === "EMITIDA" && !ventaActionBlocked
  const canDarDeBaja = canDarDeBajaSunat || canDarDeBajaInternal
  const showDarDeBajaAction = isSunat || isNotaVenta

  const canDownloadBajaXml = !hideSunat && normalizedSunatBajaEstado !== ""
  const canDownloadBajaCdr =
    !hideSunat && ["ACEPTADO", "ACEPTADA", "OBSERVADO"].includes(normalizedSunatBajaEstado)

  const isBusy =
    openingPdfVentaId === venta.idVenta ||
    downloadingPdfVentaId === venta.idVenta ||
    openingTicketVentaId === venta.idVenta ||
    downloadingXmlVentaId === venta.idVenta ||
    downloadingCdrVentaId === venta.idVenta ||
    downloadingBajaXmlVentaId === venta.idVenta ||
    downloadingBajaCdrVentaId === venta.idVenta

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
          {venta.tipoComprobante} {formatComprobante(venta)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onViewDetail(venta)}>
          <EyeIcon className="mr-2 h-4 w-4 text-slate-500" />
          Ver detalle
        </DropdownMenuItem>

        {isSunat && (
          <DropdownMenuItem
            onClick={() => {
              if (canGenerarNotaCredito) onGenerarNotaCredito(venta)
            }}
            disabled={!canGenerarNotaCredito}
            className="text-sky-700 focus:text-sky-700 dark:text-sky-400"
          >
            <DocumentTextIcon className="mr-2 h-4 w-4" />
            Generar nota de credito
          </DropdownMenuItem>
        )}

        {showDarDeBajaAction && (
          <DropdownMenuItem
            onClick={() => {
              if (canDarDeBaja) onDarDeBaja(venta)
            }}
            disabled={!canDarDeBaja}
            className="text-rose-700 focus:text-rose-700 dark:text-rose-400"
          >
            <NoSymbolIcon className="mr-2 h-4 w-4" />
            {isSunat ? "Dar de Baja SUNAT" : "Dar de Baja"}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
          Documentos
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => onOpenTicket(venta)}
          disabled={openingTicketVentaId !== null}
          className="text-amber-700 focus:text-amber-700 dark:text-amber-400"
        >
          {openingTicketVentaId === venta.idVenta ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TicketIcon className="mr-2 h-4 w-4" />
          )}
          Abrir ticket
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onOpenPdf(venta)}
          disabled={openingPdfVentaId !== null || downloadingPdfVentaId !== null}
          className="text-blue-700 focus:text-blue-700 dark:text-blue-400"
        >
          {openingPdfVentaId === venta.idVenta ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowTopRightOnSquareIcon className="mr-2 h-4 w-4" />
          )}
          Abrir PDF
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDownloadPdf(venta)}
          disabled={openingPdfVentaId !== null || downloadingPdfVentaId !== null}
          className="text-rose-700 focus:text-rose-700 dark:text-rose-400"
        >
          {downloadingPdfVentaId === venta.idVenta ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
          )}
          Descargar PDF
        </DropdownMenuItem>

        {!hideSunat && canDownloadSunatDocs && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
              SUNAT
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => onDownloadXml(venta)}
              disabled={downloadingXmlVentaId !== null}
              className="text-green-700 focus:text-green-700 dark:text-green-400"
            >
              {downloadingXmlVentaId === venta.idVenta ? (
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
              )}
              Descargar XML
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onDownloadCdr(venta)}
              disabled={downloadingCdrVentaId !== null}
              className="text-indigo-700 focus:text-indigo-700 dark:text-indigo-400"
            >
              {downloadingCdrVentaId === venta.idVenta ? (
                <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
              )}
              Descargar CDR
            </DropdownMenuItem>
          </>
        )}

        {(canDownloadBajaXml || canDownloadBajaCdr) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
              Baja SUNAT
            </DropdownMenuLabel>

            {canDownloadBajaXml && (
              <DropdownMenuItem
                onClick={() => onDownloadBajaXml(venta)}
                disabled={downloadingBajaXmlVentaId !== null}
                className="text-orange-700 focus:text-orange-700 dark:text-orange-400"
              >
                {downloadingBajaXmlVentaId === venta.idVenta ? (
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
                )}
                XML de baja
              </DropdownMenuItem>
            )}

            {canDownloadBajaCdr && (
              <DropdownMenuItem
                onClick={() => onDownloadBajaCdr(venta)}
                disabled={downloadingBajaCdrVentaId !== null}
                className="text-purple-700 focus:text-purple-700 dark:text-purple-400"
              >
                {downloadingBajaCdrVentaId === venta.idVenta ? (
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
                )}
                CDR de baja
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
