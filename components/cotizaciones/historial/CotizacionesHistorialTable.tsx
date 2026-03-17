import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline"

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

  const canEdit = (estado: string) => estado.trim().toUpperCase() === "ACTIVA"
  const canChangeStatus = (estado: string) => {
    const normalizedEstado = estado.trim().toUpperCase()
    return normalizedEstado.length > 0 && !["ACTIVA", "CONVERTIDA"].includes(normalizedEstado)
  }
  const canConvert = (estado: string) => estado.trim().toUpperCase() === "ACTIVA"

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
                <td colSpan={9} className="px-3 py-14 text-center text-sm text-muted-foreground">
                  Cargando cotizaciones...
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
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Ver comprobante PDF"
                        aria-label={`Ver comprobante PDF de la cotizacion ${formatComprobante(cotizacion)}`}
                        onClick={() => onOpenPdf(cotizacion)}
                        disabled={
                          openingPdfCotizacionId === cotizacion.idCotizacion ||
                          downloadingPdfCotizacionId === cotizacion.idCotizacion
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                      >
                        {openingPdfCotizacionId === cotizacion.idCotizacion ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Descargar comprobante PDF"
                        aria-label={`Descargar comprobante PDF de la cotizacion ${formatComprobante(cotizacion)}`}
                        onClick={() => onDownloadPdf(cotizacion)}
                        disabled={
                          openingPdfCotizacionId === cotizacion.idCotizacion ||
                          downloadingPdfCotizacionId === cotizacion.idCotizacion
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/35"
                      >
                        {downloadingPdfCotizacionId === cotizacion.idCotizacion ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewDetail(cotizacion)}
                        className="inline-flex rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Detalle
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(cotizacion)}
                        disabled={!canEdit(cotizacion.estado)}
                        className="inline-flex rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Editar
                      </button>
                      {canChangeStatus(cotizacion.estado) && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(cotizacion)}
                          className="inline-flex rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Reactivar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onConvert(cotizacion)}
                        disabled={!canConvert(cotizacion.estado)}
                        className="inline-flex rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                      >
                        Convertir
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
            Cargando cotizaciones...
          </article>
        ) : cotizaciones.length === 0 ? (
          <article className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
            Sin cotizaciones para los filtros seleccionados
          </article>
        ) : (
          cotizaciones.map((cotizacion) => (
            <article key={cotizacion.idCotizacion} className="rounded-xl border bg-background p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{cotizacion.nombreCliente || "Sin cliente"}</p>
                  <p className="text-xs text-muted-foreground">{formatFechaHora(cotizacion.fecha)}</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEstadoBadgeClass(cotizacion.estado)}`}>
                  {cotizacion.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Cotizacion</p>
                  <p className="font-semibold">{formatComprobante(cotizacion)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{formatMonto(cotizacion.total)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Sucursal</p>
                  <p className="font-semibold">{cotizacion.nombreSucursal || "Sin sucursal"}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Items</p>
                  <p className="font-semibold">{cotizacion.items}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Usuario</p>
                  <p className="font-semibold">{cotizacion.nombreUsuario || "Sin usuario"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  title="Ver comprobante PDF"
                  aria-label={`Ver comprobante PDF de la cotizacion ${formatComprobante(cotizacion)}`}
                  onClick={() => onOpenPdf(cotizacion)}
                  disabled={
                    openingPdfCotizacionId === cotizacion.idCotizacion ||
                    downloadingPdfCotizacionId === cotizacion.idCotizacion
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                >
                  {openingPdfCotizacionId === cotizacion.idCotizacion ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  title="Descargar comprobante PDF"
                  aria-label={`Descargar comprobante PDF de la cotizacion ${formatComprobante(cotizacion)}`}
                  onClick={() => onDownloadPdf(cotizacion)}
                  disabled={
                    openingPdfCotizacionId === cotizacion.idCotizacion ||
                    downloadingPdfCotizacionId === cotizacion.idCotizacion
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/35"
                >
                  {downloadingPdfCotizacionId === cotizacion.idCotizacion ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onViewDetail(cotizacion)}
                  className="inline-flex rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Detalle
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(cotizacion)}
                  disabled={!canEdit(cotizacion.estado)}
                  className="inline-flex rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Editar
                </button>
                {canChangeStatus(cotizacion.estado) && (
                  <button
                    type="button"
                    onClick={() => onChangeStatus(cotizacion)}
                    className="inline-flex rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Reactivar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onConvert(cotizacion)}
                  disabled={!canConvert(cotizacion.estado)}
                  className="inline-flex rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/35"
                >
                  Convertir
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <p className="text-xs text-muted-foreground">
          {totalElements} cotizaciones
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
