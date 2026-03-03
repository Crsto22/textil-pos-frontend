import type { VentaHistorial } from "@/lib/types/venta"
import {
  formatComprobante,
  formatFechaHora,
  formatMonto,
  getEstadoBadgeClass,
} from "@/components/ventas/historial/historial.utils"

interface VentasHistorialTableProps {
  ventas: VentaHistorial[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalElements: number
  onRetry: () => void
  onPageChange: (nextPage: number) => void
  onViewDetail: (venta: VentaHistorial) => void
}

export function VentasHistorialTable({
  ventas,
  loading,
  error,
  page,
  totalPages,
  totalElements,
  onRetry,
  onPageChange,
  onViewDetail,
}: VentasHistorialTableProps) {
  const canGoPrev = page > 0
  const canGoNext = page + 1 < totalPages

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
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3 text-left">Fecha</th>
              <th className="px-3 py-3 text-left">Comprobante</th>
              <th className="px-3 py-3 text-left">Cliente</th>
              <th className="px-3 py-3 text-left">Usuario</th>
              <th className="px-3 py-3 text-left">Sucursal</th>
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
                <td colSpan={10} className="px-3 py-14 text-center text-sm text-muted-foreground">
                  Cargando ventas...
                </td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-14 text-center text-sm text-muted-foreground">
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
                  <td className="px-3 py-3 text-muted-foreground">{venta.nombreUsuario || "Sin usuario"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{venta.nombreSucursal || "Sin sucursal"}</td>
                  <td className="px-3 py-3 text-center font-semibold">{venta.items}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                      {venta.pagos}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{formatMonto(venta.total)}</td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoBadgeClass(venta.estado)}`}
                    >
                      {venta.estado}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onViewDetail(venta)}
                      className="inline-flex rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Detalle
                    </button>
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
            Cargando ventas...
          </article>
        ) : ventas.length === 0 ? (
          <article className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
            Sin ventas para los filtros seleccionados
          </article>
        ) : (
          ventas.map((venta) => (
            <article key={venta.idVenta} className="rounded-xl border bg-background p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{venta.nombreCliente || "Sin cliente"}</p>
                  <p className="text-xs text-muted-foreground">{formatFechaHora(venta.fecha)}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEstadoBadgeClass(venta.estado)}`}
                >
                  {venta.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Comprobante</p>
                  <p className="font-semibold">
                    {venta.tipoComprobante} {formatComprobante(venta)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{formatMonto(venta.total)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Sucursal</p>
                  <p className="font-semibold">{venta.nombreSucursal || "Sin sucursal"}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Items</p>
                  <p className="font-semibold">{venta.items}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Usuario</p>
                  <p className="font-semibold">{venta.nombreUsuario || "Sin usuario"}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-muted-foreground">Pagos</p>
                  <p className="font-semibold">{venta.pagos}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onViewDetail(venta)}
                  className="inline-flex rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Detalle
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <p className="text-xs text-muted-foreground">
          {totalElements} ventas
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
