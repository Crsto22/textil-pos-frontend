"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import {
  ArrowTrendingUpIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline"

import { MetricCard } from "@/components/Card"
import {
  ProductDonutChart,
  ProductRankingBarChart,
  ProductVariantHeatmap,
  type RankingChartDatum,
} from "@/components/reportes/productos/ProductoReporteCharts"
import { ProductosReporteFilters } from "@/components/reportes/productos/ProductosReporteFilters"
import { useAuth } from "@/lib/auth/auth-context"
import { useProductoReporte } from "@/lib/hooks/useProductoReporte"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useSucursalGlobal } from "@/lib/sucursal-global-context"
import type { ProductoReporteFiltro } from "@/lib/types/producto-reporte"

const FILTER_OPTIONS: { key: ProductoReporteFiltro; label: string }[] = [
  { key: "HOY", label: "Hoy" },
  { key: "ULT_7_DIAS", label: "Ultimos 7 dias" },
  { key: "ULT_14_DIAS", label: "Ultimos 14 dias" },
  { key: "ULT_30_DIAS", label: "Ultimos 30 dias" },
  { key: "ULT_12_MESES", label: "Ultimos 12 meses" },
]

const NUMBER_FORMATTER = new Intl.NumberFormat("es-PE")

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

function formatPlainNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "0"
  return NUMBER_FORMATTER.format(value)
}

function formatRotation(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "0.00"
  return value.toFixed(2)
}

function buildRankingData(
  items:
    | {
        producto?: string
        variante?: string | null
        color?: string | null
        talla?: string | null
        categoria?: string
        unidadesVendidas: number
        montoVendido: number
      }[]
    | undefined,
  valueKey: "montoVendido" | "unidadesVendidas",
  labelKey: "producto" | "categoria"
): RankingChartDatum[] {
  return (items ?? []).map((item) => ({
    label:
      labelKey === "producto"
        ? buildProductVariantLabel(item)
        : (item[labelKey] ?? "Sin nombre").trim() || "Sin nombre",
    value: item[valueKey],
  }))
}

function buildProductVariantLabel(item: {
  producto?: string
  variante?: string | null
  color?: string | null
  talla?: string | null
}): string {
  const productName = (item.producto ?? "Producto sin nombre").trim() || "Producto sin nombre"
  const variantName =
    item.variante?.trim() ||
    [item.color?.trim(), item.talla?.trim()].filter(Boolean).join(" / ")

  return variantName ? `${productName} · ${variantName}` : productName
}

function ProductoReporteSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80"
          />
        ))}
      </div>
      <div className="h-[420px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
        <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      </div>
      <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
    </div>
  )
}

export function ProductosReportePage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)
  const [activeFilter, setActiveFilter] = useState<ProductoReporteFiltro>("ULT_30_DIAS")
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

  const canLoadReport = Boolean(user) && (isAdmin || userHasSucursal)
  const reportFilters = useMemo(
    () => ({
      filtro: activeFilter,
      idSucursal: resolvedSucursalId,
    }),
    [activeFilter, resolvedSucursalId]
  )
  const { data, loading, error, refresh } = useProductoReporte(reportFilters, canLoadReport)

  const montoChartData = useMemo(
    () => buildRankingData(data?.topProductosPorMonto, "montoVendido", "producto"),
    [data?.topProductosPorMonto]
  )
  const unidadesChartData = useMemo(
    () =>
      buildRankingData(data?.topProductosPorUnidades, "unidadesVendidas", "producto"),
    [data?.topProductosPorUnidades]
  )
  const categoriasChartData = useMemo(
    () => buildRankingData(data?.ventasPorCategoria, "montoVendido", "categoria"),
    [data?.ventasPorCategoria]
  )
  const currentSucursalLabel = userHasSucursal
    ? user?.nombreSucursal || `Sucursal #${user?.idSucursal}`
    : null

  if (!user) return null

  if (!isAdmin && !userHasSucursal) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        No se puede generar el reporte porque tu usuario no tiene una sucursal asignada.
      </div>
    )
  }

  if (loading && !data) {
    return <ProductoReporteSkeleton />
  }

  return (
    <div className="space-y-6">
      <ProductosReporteFilters
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

      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Productos activos"
            value={formatPlainNumber(data.kpis.productosActivos)}
            icon={CubeIcon}
            iconColor="text-blue-600"
          />
          <MetricCard
            title="Variantes activas"
            value={formatPlainNumber(data.kpis.variantesActivas)}
            icon={Squares2X2Icon}
            iconColor="text-cyan-600"
          />
          <MetricCard
            title="Sin stock"
            value={formatPlainNumber(data.kpis.variantesSinStock)}
            icon={ExclamationTriangleIcon}
            iconColor="text-rose-600"
          />
          <MetricCard
            title="Rotacion promedio"
            value={formatRotation(data.kpis.rotacionPromedio)}
            icon={ArrowTrendingUpIcon}
            iconColor="text-emerald-600"
          />
        </div>
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
          Se muestra el ultimo resultado disponible. No se pudo refrescar el reporte:
          {" "}
          {error}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Top variantes por unidades
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mide traccion y rotacion por producto y variante vendida.
            </p>
          </div>
          <ProductRankingBarChart
            data={unidadesChartData}
            valueType="units"
            emptyMessage="No hay unidades vendidas en el periodo seleccionado."
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Top variantes por monto
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Participacion de las variantes con mayor impacto economico.
            </p>
          </div>
          <ProductDonutChart
            data={montoChartData}
            valueType="currency"
            emptyMessage="No hay ventas registradas para este periodo."
            totalLabel="Monto"
            legendPlacement="bottom"
          />
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 space-y-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Ventas por categoria
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Descubre donde se concentra el ingreso del catalogo.
          </p>
        </div>
        <ProductDonutChart
          data={categoriasChartData}
          valueType="currency"
          emptyMessage="No hay categorias con ventas para mostrar."
          totalLabel="Categorias"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 space-y-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Heatmap por talla y color
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Identifica que combinaciones concentran la mayor demanda.
          </p>
        </div>
        <ProductVariantHeatmap data={data?.heatmapVentasPorTallaColor ?? []} />
      </section>

    </div>
  )
}
