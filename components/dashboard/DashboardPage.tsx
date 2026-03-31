"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import {
  ArchiveBoxArrowDownIcon,
  ArrowTrendingUpIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon,
  TicketIcon,
} from "@heroicons/react/24/outline"

import { MetricCard } from "@/components/Card"
import { AdminDashboardContent } from "@/components/dashboard/AdminDashboardContent"
import { DashboardFilters } from "@/components/dashboard/DashboardFilters"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"
import { formatMonedaPen } from "@/components/productos/productos.utils"
import {
  ProductRankingBarChart,
  type RankingChartDatum,
} from "@/components/reportes/productos/ProductoReporteCharts"
import { VentaTendenciaChart } from "@/components/reportes/ventas/VentaResumenCharts"
import { useAuth } from "@/lib/auth/auth-context"
import { useDashboard } from "@/lib/hooks/useDashboard"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useSucursalGlobal } from "@/lib/sucursal-global-context"
import type {
  DashboardAlmacenData,
  DashboardFiltro,
  DashboardTopProduct,
  DashboardVentasData,
} from "@/lib/types/dashboard"

const FILTER_OPTIONS: { key: DashboardFiltro; label: string }[] = [
  { key: "HOY", label: "Hoy" },
  { key: "ULT_7_DIAS", label: "Ultimos 7 dias" },
  { key: "ULT_14_DIAS", label: "Ultimos 14 dias" },
  { key: "ULT_30_DIAS", label: "Ultimos 30 dias" },
  { key: "ULT_12_MESES", label: "Ultimos 12 meses" },
]

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

function buildVariantLabel(item: DashboardTopProduct): string {
  const variant = [item.color?.trim(), item.talla?.trim()].filter(Boolean).join(" / ")
  return variant ? `${item.producto} - ${variant}` : item.producto
}

function buildTopProductsChartData(topList?: DashboardTopProduct[]): RankingChartDatum[] {
  return (topList ?? []).map((item) => ({
    label: buildVariantLabel(item),
    value: item.cantidadVendida ?? item.stock ?? 0,
  }))
}

function VentasDashboardContent({ data }: { data: DashboardVentasData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Mis ventas totales"
          value={formatMonedaPen(data.misVentasTotales)}
          icon={CurrencyDollarIcon}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Mis productos vendidos"
          value={String(data.misProductosVendidos)}
          icon={CubeIcon}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Mi promedio de venta"
          value={formatMonedaPen(data.miPromedioVenta)}
          icon={PresentationChartLineIcon}
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Cotizaciones abiertas"
          value={String(data.misCotizacionesAbiertas)}
          icon={TicketIcon}
          iconColor="text-orange-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Mis ventas por fecha
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Evolucion del monto vendido dentro del periodo actual.
            </p>
          </div>
          <VentaTendenciaChart data={data.misVentasPorFecha} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Top productos mas vendidos
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Variantes con mejor salida en tu sucursal.
            </p>
          </div>
          <ProductRankingBarChart
            data={buildTopProductsChartData(data.topProductosMasVendidos)}
            valueType="units"
            emptyMessage="No hay productos suficientes para construir el ranking."
          />
        </section>
      </div>
    </div>
  )
}

function AlmacenDashboardContent({ data }: { data: DashboardAlmacenData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total fisico en tienda"
          value={String(data.totalFisicoEnTienda)}
          icon={ArchiveBoxArrowDownIcon}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Variantes disponibles"
          value={String(data.variantesDisponibles)}
          icon={CubeIcon}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Variantes agotadas"
          value={String(data.variantesAgotadas)}
          icon={ExclamationTriangleIcon}
          iconColor="text-red-600"
        />
        <MetricCard
          title="Stock bajo"
          value={String(data.stockBajo)}
          icon={ArrowTrendingUpIcon}
          iconColor="text-orange-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Reposicion urgente
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Variantes con stock comprometido para revisar primero.
            </p>
          </div>
          <div className="space-y-3">
            {data.reposicionUrgente.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                No hay productos urgentes para reponer.
              </div>
            ) : (
              data.reposicionUrgente.map((prod, index) => (
                <div
                  key={`${prod.idProductoVariante ?? index}-${prod.sku ?? prod.producto}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {buildVariantLabel({
                        idProductoVariante: prod.idProductoVariante,
                        producto: prod.producto,
                        color: prod.color,
                        talla: prod.talla,
                        cantidadVendida: 0,
                        stock: prod.stock,
                        sku: prod.sku,
                      })}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      SKU: {prod.sku ?? "Sin SKU"}
                    </p>
                  </div>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    Stock {prod.stock}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Top mayor salida
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Variantes con mayor movimiento dentro del almacen.
            </p>
          </div>
          <ProductRankingBarChart
            data={buildTopProductsChartData(data.topMayorSalida)}
            valueType="units"
            emptyMessage="No hay datos de salida para mostrar."
          />
        </section>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const isAlmacen = user?.rol === "ALMACEN"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)
  const [activeFilter, setActiveFilter] = useState<DashboardFiltro>("HOY")
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const { sucursalOptions, loadingSucursales, errorSucursales } = useSucursalOptions(isAdmin)
  const { sucursalGlobal } = useSucursalGlobal()

  useEffect(() => {
    if (!isAdmin || sucursalGlobal === null) return
    startTransition(() => setSelectedSucursalId(sucursalGlobal.idSucursal))
  }, [sucursalGlobal, isAdmin])

  const resolvedSucursalId = isAdmin
    ? selectedSucursalId
    : userHasSucursal
      ? user.idSucursal
      : null

  const dashboardFilters = useMemo(
    () => ({
      filtro: activeFilter,
      idSucursal: resolvedSucursalId,
    }),
    [activeFilter, resolvedSucursalId]
  )

  const { data, loading, error, refresh } = useDashboard(dashboardFilters, Boolean(user))
  const currentSucursalLabel = userHasSucursal
    ? user?.nombreSucursal || `Sucursal #${user?.idSucursal}`
    : null

  if (!user) return null

  if (loading && !data) {
    return <DashboardSkeleton showFilters={!isAlmacen} />
  }

  return (
    <div className="space-y-6">
      {!isAlmacen ? (
        <DashboardFilters
          activeFilter={activeFilter}
          filterOptions={FILTER_OPTIONS}
          onFilterChange={setActiveFilter}
          isAdmin={isAdmin}
          selectedSucursalId={selectedSucursalId}
          onSucursalChange={setSelectedSucursalId}
          sucursalOptions={sucursalOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          loadingSucursales={loadingSucursales}
          errorSucursales={errorSucursales}
          currentSucursalLabel={currentSucursalLabel}
          loading={loading}
          onRefresh={() => {
            void refresh()
          }}
        />
      ) : null}

      {error && !data ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                void refresh()
              }}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
            >
              Reintentar
            </button>
          </div>
        </section>
      ) : null}

      {error && data ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Se muestra el ultimo resultado disponible. No se pudo refrescar el dashboard:{" "}
          {error}
        </section>
      ) : null}

      {data?.dashboard === "ADMIN" ? <AdminDashboardContent data={data} /> : null}
      {data?.dashboard === "VENTAS" ? <VentasDashboardContent data={data} /> : null}
      {data?.dashboard === "ALMACEN" ? <AlmacenDashboardContent data={data} /> : null}
    </div>
  )
}
