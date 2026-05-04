"use client"

import {
  ArchiveBoxArrowDownIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  RectangleStackIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline"

import { MetricCard } from "@/components/Card"
import { formatMonedaPen } from "@/components/productos/productos.utils"
import {
  ProductDonutChart,
  ProductRankingBarChart,
  type RankingChartDatum,
} from "@/components/reportes/productos/ProductoReporteCharts"
import { VentaTendenciaChart } from "@/components/reportes/ventas/VentaResumenCharts"
import type { DashboardAdminData, DashboardStockCriticoItem } from "@/lib/types/dashboard"

function buildVariantLabel(item: {
  producto: string
  color: string | null
  talla: string | null
}): string {
  const variantName = [item.color?.trim(), item.talla?.trim()].filter(Boolean).join(" / ")
  return variantName ? `${item.producto} - ${variantName}` : item.producto
}

function buildStockLabel(item: DashboardStockCriticoItem): string {
  const variant = [item.color?.trim(), item.talla?.trim()].filter(Boolean).join(" / ")
  return variant ? `${item.producto} - ${variant}` : item.producto
}

function EmptyStockList({ message }: { message: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
      {message}
    </div>
  )
}

export function AdminDashboardContent({ data }: { data: DashboardAdminData }) {
  const paymentChartData: RankingChartDatum[] = data.ingresosPorMetodoPago.map((item) => ({
    label: item.metodoPago.trim() || "Sin metodo",
    value: item.monto,
  }))

  const topProductsChartData: RankingChartDatum[] = data.topProductosMasVendidos.map((item) => ({
    label: buildVariantLabel({
      producto: item.producto.trim() || "Producto",
      color: item.color ?? null,
      talla: item.talla ?? null,
    }),
    value: item.cantidadVendida,
  }))

  const voucherTypeChartData: RankingChartDatum[] = data.comprobantesPorTipo.map((item) => ({
    label: item.tipoComprobante.trim() || "Sin tipo",
    value: item.cantidadComprobantes,
  }))

  const statusChartData: RankingChartDatum[] = data.distribucionPorEstado.map((item, index) => ({
    label: item.estado,
    value: item.cantidadComprobantes,
    color: index === 0 ? "#2563EB" : "#F97316",
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          title="Ventas del filtro"
          value={formatMonedaPen(data.kpis.ventasTotalesFiltro)}
          icon={BanknotesIcon}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Ventas del periodo"
          value={formatMonedaPen(data.kpis.ventasDelMes)}
          icon={ShoppingBagIcon}
          iconColor="text-cyan-600"
        />
        <MetricCard
          title="Ticket promedio"
          value={formatMonedaPen(data.kpis.ticketPromedio)}
          icon={CreditCardIcon}
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Comprobantes emitidos"
          value={String(data.kpis.comprobantesEmitidos)}
          icon={ClipboardDocumentListIcon}
          iconColor="text-violet-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          title="Comprobantes anulados"
          value={String(data.kpis.comprobantesAnulados)}
          icon={ExclamationTriangleIcon}
          iconColor="text-rose-600"
        />
        <MetricCard
          title="Monto anulado"
          value={formatMonedaPen(data.kpis.montoAnulado)}
          icon={ArchiveBoxArrowDownIcon}
          iconColor="text-orange-600"
        />
        <MetricCard
          title="Unidades vendidas"
          value={String(data.kpis.unidadesVendidas)}
          icon={CubeIcon}
          iconColor="text-sky-600"
        />
        <MetricCard
          title="Variantes vendidas"
          value={String(data.kpis.variantesVendidas)}
          icon={RectangleStackIcon}
          iconColor="text-teal-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
            <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
              Tendencia de ventas
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Evolucion diaria del monto emitido en el rango actual.
            </p>
          </div>
          <VentaTendenciaChart data={data.ventasPorFecha} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
            <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
              Ingresos por metodo de pago
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Participacion de cada metodo sobre el ingreso total emitido.
            </p>
          </div>
          <ProductDonutChart
            data={paymentChartData}
            valueType="currency"
            totalLabel="Metodos"
            legendPlacement="bottom"
            emptyMessage="No hay ingresos por metodo de pago para mostrar."
          />
        </section>
      </div>

      <div className="hidden sm:grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Top variantes mas vendidas
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Variantes con mayor salida en el periodo seleccionado.
            </p>
          </div>
          <ProductRankingBarChart
            data={topProductsChartData}
            valueType="units"
            emptyMessage="No hay variantes vendidas para mostrar."
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Comprobantes por tipo
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compara el volumen emitido entre nota de venta, boleta y factura.
            </p>
          </div>
          <ProductRankingBarChart
            data={voucherTypeChartData}
            valueType="units"
            emptyMessage="No hay comprobantes para agrupar."
          />
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
          <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
            Distribucion por estado
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Balance entre comprobantes emitidos y anulados.
          </p>
        </div>
        <ProductDonutChart
          data={statusChartData}
          valueType="units"
          totalLabel="Estados"
          legendPlacement="bottom"
          emptyMessage="No hay estados para mostrar."
        />
      </section>

      <section className="hidden sm:block rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 sm:mb-5 space-y-0.5 sm:space-y-1">
          <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
            Stock critico
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Variantes agotadas y proximas a agotarse para priorizar reposicion.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Agotados
            </h3>
            {data.stockCritico.agotados.length === 0 ? (
              <EmptyStockList message="No hay variantes agotadas en este momento." />
            ) : (
              <div className="space-y-3">
                {data.stockCritico.agotados.map((item, index) => (
                  <div
                    key={`${item.idProductoVariante ?? index}-${item.sku ?? item.producto}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {buildStockLabel(item)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          SKU: {item.sku ?? "Sin SKU"}
                        </p>
                      </div>
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                        Stock {item.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Prontos a agotarse
            </h3>
            {data.stockCritico.prontosAgotarse.length === 0 ? (
              <EmptyStockList message="No hay variantes en nivel critico de stock." />
            ) : (
              <div className="space-y-3">
                {data.stockCritico.prontosAgotarse.map((item, index) => (
                  <div
                    key={`${item.idProductoVariante ?? index}-${item.sku ?? item.producto}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {buildStockLabel(item)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          SKU: {item.sku ?? "Sin SKU"}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        Stock {item.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
