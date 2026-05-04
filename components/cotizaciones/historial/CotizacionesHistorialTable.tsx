import {
  ArrowPathIcon,
  ArrowRightCircleIcon,
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilSquareIcon,
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
import type { CotizacionHistorial } from "@/lib/types/cotizacion"
import {
  formatComprobante,
  formatFechaHora,
  formatMonto,
  getEstadoBadgeClass,
} from "@/components/ventas/historial/historial.utils"

interface CotizacionesHistorialTableProps {
  cotizaciones: CotizacionHistorial[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalElements: number
  onRetry: () => void
  onPageChange: (nextPage: number) => void
  onViewDetail: (cotizacion: CotizacionHistorial) => void
  onOpenPdf: (cotizacion: CotizacionHistorial) => void
  onDownloadPdf: (cotizacion: CotizacionHistorial) => void
  onEdit: (cotizacion: CotizacionHistorial) => void
  onChangeStatus: (cotizacion: CotizacionHistorial) => void
  onConvert: (cotizacion: CotizacionHistorial) => void
  openingPdfCotizacionId: number | null
  downloadingPdfCotizacionId: number | null
}

export function CotizacionesHistorialTable({
  cotizaciones,
  loading,
  error,
  page,
  totalPages,
  totalElements,
  onRetry,
  onPageChange,
  onViewDetail,
  onOpenPdf,
  onDownloadPdf,
  onEdit,
  onChangeStatus,
  onConvert,
  openingPdfCotizacionId,
  downloadingPdfCotizacionId,
}: CotizacionesHistorialTableProps) {
  const canGoPrev = page > 0
  const canGoNext = page + 1 < totalPages

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
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3 text-left">Fecha</th>
              <th className="px-3 py-3 text-left">Cotizacion</th>
              <th className="px-3 py-3 text-left">Cliente</th>
              <th className="px-3 py-3 text-left">Usuario</th>
              <th className="px-3 py-3 text-left">Sucursal</th>
              <th className="px-3 py-3 text-center">Items</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-center">Estado</th>
              <th className="px-3 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-14 text-center">
                  <LoaderSpinner text="Cargando cotizaciones..." />
                </td>
              </tr>
            ) : cotizaciones.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-14 text-center text-sm text-muted-foreground">
                  Sin cotizaciones para los filtros seleccionados
                </td>
              </tr>
            ) : (
              cotizaciones.map((cotizacion) => (
                <tr key={cotizacion.idCotizacion} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-3 font-medium">{formatFechaHora(cotizacion.fecha)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold">#{cotizacion.idCotizacion}</span>
                      <span className="text-xs text-muted-foreground">{formatComprobante(cotizacion)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-medium">{cotizacion.nombreCliente || "Sin cliente"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{cotizacion.nombreUsuario || "Sin usuario"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{cotizacion.nombreSucursal || "Sin sucursal"}</td>
                  <td className="px-3 py-3 text-center font-semibold">{cotizacion.items}</td>
                  <td className="px-3 py-3 text-right font-semibold">{formatMonto(cotizacion.total)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoBadgeClass(cotizacion.estado)}`}>
                      {cotizacion.estado}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ActionButtons
                      cotizacion={cotizacion}
                      openingPdfCotizacionId={openingPdfCotizacionId}
                      downloadingPdfCotizacionId={downloadingPdfCotizacionId}
                      onViewDetail={onViewDetail}
                      onOpenPdf={onOpenPdf}
                      onDownloadPdf={onDownloadPdf}
                      onEdit={onEdit}
                      onChangeStatus={onChangeStatus}
                      onConvert={onConvert}
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
            <LoaderSpinner text="Cargando cotizaciones..." />
          </article>
        ) : cotizaciones.length === 0 ? (
          <article className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            Sin cotizaciones para los filtros seleccionados
          </article>
        ) : (
          cotizaciones.map((cotizacion) => (
            <div
              key={cotizacion.idCotizacion}
              role="button"
              tabIndex={0}
              onClick={() => onViewDetail(cotizacion)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onViewDetail(cotizacion)
                }
              }}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-left transition hover:border-slate-200 hover:bg-white dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-900/70"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {cotizacion.nombreCliente || "Sin cliente"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatFechaHora(cotizacion.fecha)}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      #{cotizacion.idCotizacion}
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEstadoBadgeClass(cotizacion.estado)}`}>
                      {cotizacion.estado}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Documento
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatComprobante(cotizacion)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Total
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatMonto(cotizacion.total)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Usuario
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {cotizacion.nombreUsuario || "Sin usuario"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Sucursal e items
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {cotizacion.nombreSucursal || "Sin sucursal"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {cotizacion.items} item(s)
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onViewDetail(cotizacion)
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                >
                  <EyeIcon className="h-4 w-4" />
                  Ver detalle
                </button>
                <ActionButtons
                  cotizacion={cotizacion}
                  openingPdfCotizacionId={openingPdfCotizacionId}
                  downloadingPdfCotizacionId={downloadingPdfCotizacionId}
                  onViewDetail={onViewDetail}
                  onOpenPdf={onOpenPdf}
                  onDownloadPdf={onDownloadPdf}
                  onEdit={onEdit}
                  onChangeStatus={onChangeStatus}
                  onConvert={onConvert}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/60">
        <p className="text-xs text-muted-foreground">
          {totalElements} cotizaciones
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
  cotizacion: CotizacionHistorial
  openingPdfCotizacionId: number | null
  downloadingPdfCotizacionId: number | null
  onViewDetail: (cotizacion: CotizacionHistorial) => void
  onOpenPdf: (cotizacion: CotizacionHistorial) => void
  onDownloadPdf: (cotizacion: CotizacionHistorial) => void
  onEdit: (cotizacion: CotizacionHistorial) => void
  onChangeStatus: (cotizacion: CotizacionHistorial) => void
  onConvert: (cotizacion: CotizacionHistorial) => void
}

function ActionButtons({
  cotizacion,
  openingPdfCotizacionId,
  downloadingPdfCotizacionId,
  onViewDetail,
  onOpenPdf,
  onDownloadPdf,
  onEdit,
  onChangeStatus,
  onConvert,
}: ActionButtonsProps) {
  const normalizedEstado = cotizacion.estado.trim().toUpperCase()
  const isActiva = normalizedEstado === "ACTIVA"
  const isConvertida = normalizedEstado === "CONVERTIDA"
  const canChangeStatus = normalizedEstado.length > 0 && !["ACTIVA", "CONVERTIDA"].includes(normalizedEstado)
  const isBusy =
    openingPdfCotizacionId === cotizacion.idCotizacion ||
    downloadingPdfCotizacionId === cotizacion.idCotizacion

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
          #{cotizacion.idCotizacion} · {formatComprobante(cotizacion)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onViewDetail(cotizacion)}>
          <EyeIcon className="mr-2 h-4 w-4 text-slate-500" />
          Ver detalle
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onEdit(cotizacion)}
          disabled={!isActiva}
          className="text-amber-700 focus:text-amber-700 dark:text-amber-400"
        >
          <PencilSquareIcon className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>

        {canChangeStatus && (
          <DropdownMenuItem
            onClick={() => onChangeStatus(cotizacion)}
            className="text-emerald-700 focus:text-emerald-700 dark:text-emerald-400"
          >
            <ArrowPathIcon className="mr-2 h-4 w-4" />
            Reactivar
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => onConvert(cotizacion)}
          disabled={!isActiva || isConvertida}
          className="text-blue-700 focus:text-blue-700 dark:text-blue-400"
        >
          <ArrowRightCircleIcon className="mr-2 h-4 w-4" />
          Convertir a venta
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
          Documentos
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => onOpenPdf(cotizacion)}
          disabled={isBusy}
          className="text-blue-700 focus:text-blue-700 dark:text-blue-400"
        >
          {openingPdfCotizacionId === cotizacion.idCotizacion ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowTopRightOnSquareIcon className="mr-2 h-4 w-4" />
          )}
          Abrir PDF
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDownloadPdf(cotizacion)}
          disabled={isBusy}
          className="text-rose-700 focus:text-rose-700 dark:text-rose-400"
        >
          {downloadingPdfCotizacionId === cotizacion.idCotizacion ? (
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
          )}
          Descargar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
