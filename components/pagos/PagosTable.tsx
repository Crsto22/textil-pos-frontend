import { memo } from "react"
import Image from "next/image"
import { LoaderSpinner } from "@/components/ui/loader-spinner"

import type { PagoListado } from "@/lib/types/pago"
import {
  formatPagoComprobante,
  formatPagoFecha,
  formatPagoMonto,
  getMetodoPagoBadgeClasses,
  getMetodoPagoIcon,
  getMetodoPagoLabel,
  getMetodoPagoLogo,
} from "@/components/pagos/pagos.utils"

interface PagosTableProps {
  pagos: PagoListado[]
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  totalElements: number
  onRetry: () => void
  onPageChange: (nextPage: number) => void
}

function PagosTableComponent({
  pagos,
  loading,
  error,
  page,
  totalPages,
  totalElements,
  onRetry,
  onPageChange,
}: PagosTableProps) {
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
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pago
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Venta
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Metodo
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cod. operacion
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Registrado por
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sucursal
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Monto
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center">
                  <LoaderSpinner text="Cargando pagos..." />
                </td>
              </tr>
            ) : pagos.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center text-muted-foreground">
                  No se encontraron pagos con los filtros seleccionados
                </td>
              </tr>
            ) : (
              pagos.map((pago) => {
                const MetodoIcon = getMetodoPagoIcon(pago.metodoPago)
                const metodoLogo = getMetodoPagoLogo(pago.metodoPago)

                return (
                  <tr
                    key={pago.idPago}
                    className="border-b align-top transition-colors last:border-0 hover:bg-muted/25"
                  >
                    <td className="px-4 py-3.5 font-medium">{formatPagoFecha(pago.fecha)}</td>

                    <td className="px-4 py-3.5">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                          {metodoLogo ? (
                            <Image
                              src={metodoLogo.src}
                              alt={metodoLogo.alt}
                              width={22}
                              height={22}
                              className="h-[22px] w-[22px] object-contain"
                            />
                          ) : (
                            <MetodoIcon className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            Pago #{pago.idPago}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {pago.tipoComprobante}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {formatPagoComprobante(pago)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Venta #{pago.idVenta ?? "-"}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getMetodoPagoBadgeClasses(
                          pago.metodoPago
                        )}`}
                      >
                        {metodoLogo ? (
                          <Image
                            src={metodoLogo.src}
                            alt={metodoLogo.alt}
                            width={14}
                            height={14}
                            className="h-3.5 w-3.5 object-contain"
                          />
                        ) : null}
                        {getMetodoPagoLabel(pago.metodoPago)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      {pago.nombreCliente}
                    </td>

                    <td className="px-4 py-3.5 text-muted-foreground">
                      {pago.codigoOperacion ?? "Sin codigo"}
                    </td>

                    <td className="px-4 py-3.5 text-muted-foreground">
                      {pago.nombreUsuario}
                    </td>

                    <td className="px-4 py-3.5 text-muted-foreground">
                      {pago.nombreSucursal}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatPagoMonto(pago.monto)}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {loading ? (
          <article className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 dark:border-slate-700 dark:bg-slate-900/40">
            <LoaderSpinner text="Cargando pagos..." />
          </article>
        ) : pagos.length === 0 ? (
          <article className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            No se encontraron pagos con los filtros seleccionados
          </article>
        ) : (
          pagos.map((pago) => {
            const MetodoIcon = getMetodoPagoIcon(pago.metodoPago)
            const metodoLogo = getMetodoPagoLogo(pago.metodoPago)

            return (
              <article key={pago.idPago} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                    {metodoLogo ? (
                      <Image
                        src={metodoLogo.src}
                        alt={metodoLogo.alt}
                        width={22}
                        height={22}
                        className="h-[22px] w-[22px] object-contain"
                      />
                    ) : (
                      <MetodoIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          Pago #{pago.idPago}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {formatPagoFecha(pago.fecha)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getMetodoPagoBadgeClasses(
                          pago.metodoPago
                        )}`}
                      >
                        {metodoLogo ? (
                          <Image
                            src={metodoLogo.src}
                            alt={metodoLogo.alt}
                            width={14}
                            height={14}
                            className="h-3.5 w-3.5 object-contain"
                          />
                        ) : (
                          <MetodoIcon className="h-3.5 w-3.5" />
                        )}
                        {getMetodoPagoLabel(pago.metodoPago)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Venta
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {pago.tipoComprobante} {formatPagoComprobante(pago)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          Venta #{pago.idVenta ?? "-"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Monto
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {formatPagoMonto(pago.monto)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Cliente
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {pago.nombreCliente}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Operacion
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {pago.codigoOperacion ?? "Sin codigo"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Usuario
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {pago.nombreUsuario}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Sucursal
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {pago.nombreSucursal}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/60">
        <p className="text-xs text-muted-foreground">
          {totalElements} pagos
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

export const PagosTable = memo(PagosTableComponent)
