import {
  ArrowPathIcon,
  CalendarDaysIcon,
  UserIcon,
} from "@heroicons/react/24/outline"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatearRangoOferta } from "@/lib/oferta-utils"
import { formatComprobante, formatFechaHora, formatMonto } from "@/components/ventas/historial/historial.utils"
import type { CotizacionResponse } from "@/lib/types/cotizacion"

interface CotizacionDetalleModalProps {
  open: boolean
  detalle: CotizacionResponse | null
  loading: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onRetry: () => void
}

function renderDescuentoLabel(tipoDescuento: string | null): string {
  if (!tipoDescuento) return "Sin descuento"
  return tipoDescuento
}

export function CotizacionDetalleModal({
  open,
  detalle,
  loading,
  error,
  onOpenChange,
  onRetry,
}: CotizacionDetalleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[96vh] w-[96vw] overflow-y-auto p-0 sm:max-w-[1180px]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Detalle de Cotizacion</DialogTitle>
          <DialogDescription>
            Productos, condiciones y resumen de la cotizacion seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/20 dark:text-slate-300">
              Cargando detalle de cotizacion...
            </div>
          )}

          {!loading && error && (
            <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 dark:border-rose-900/60 dark:bg-rose-900/20">
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
            <article className="overflow-hidden rounded-xl border bg-background">
              <header className="border-b bg-slate-50 px-5 py-4 dark:bg-slate-900/30">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      POS Textil
                    </p>
                    <h3 className="text-lg font-semibold">
                      Cotizacion {formatComprobante(detalle)}
                    </h3>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                    {detalle.estado}
                  </span>
                </div>
              </header>

              <div className="grid gap-4 border-b px-5 py-4 md:grid-cols-2 xl:grid-cols-3">
                <p className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Cliente:</span>
                  <span>{detalle.nombreCliente}</span>
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Fecha:</span>
                  <span>{formatFechaHora(detalle.fecha)}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Sucursal:</span>{" "}
                  <span>{detalle.nombreSucursal}</span>
                </p>
              </div>

              <div className="border-b px-5 py-4">
                <h4 className="mb-3 text-sm font-semibold">Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-left">SKU</th>
                        <th className="px-3 py-2 text-left">Variante</th>
                        <th className="px-3 py-2 text-center">Cant.</th>
                        <th className="px-3 py-2 text-right">P. Oferta</th>
                        <th className="px-3 py-2 text-right">P. Unit</th>
                        <th className="px-3 py-2 text-right">Desc.</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.detalles.map((item) => (
                        <tr key={item.idCotizacionDetalle} className="border-b last:border-0">
                          <td className="px-3 py-2 font-medium">{item.nombreProducto}</td>
                          <td className="px-3 py-2 text-muted-foreground">{item.sku || "-"}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {item.color || "-"} / {item.talla || "-"}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold">{item.cantidad}</td>
                          <td className="px-3 py-2 text-right">
                            {typeof item.precioOferta === "number"
                              ? (
                                  <div className="space-y-0.5 text-right">
                                    <p>{formatMonto(item.precioOferta)}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {formatearRangoOferta(item.ofertaInicio, item.ofertaFin)}
                                    </p>
                                  </div>
                                )
                              : "-"}
                          </td>
                          <td className="px-3 py-2 text-right">{formatMonto(item.precioUnitario)}</td>
                          <td className="px-3 py-2 text-right">{formatMonto(item.descuento)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatMonto(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 border-b px-5 py-4 md:grid-cols-[1.4fr_0.8fr]">
                <div className="space-y-2 rounded-xl border bg-slate-50/60 p-4 dark:bg-slate-900/20">
                  <h4 className="text-sm font-semibold">Observacion</h4>
                  <p className="text-sm text-muted-foreground">
                    {detalle.observacion?.trim() || "Sin observaciones registradas"}
                  </p>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatMonto(detalle.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Descuento ({renderDescuentoLabel(detalle.tipoDescuento)})
                    </span>
                    <span className="font-medium">{formatMonto(detalle.descuentoTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      IGV ({detalle.igvPorcentaje.toFixed(2)}%)
                    </span>
                    <span className="font-medium">{formatMonto(detalle.igv)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatMonto(detalle.total)}</span>
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
