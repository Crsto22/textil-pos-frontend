"use client"

import { useMemo, useState } from "react"
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline"

import { MetricCard } from "@/components/Card"
import { formatMonedaPen } from "@/components/productos/productos.utils"
import {
  VentaDonutChart,
  VentaRankingBarChart,
  VentaTendenciaChart,
  type RankingChartDatum,
} from "@/components/reportes/ventas/VentaResumenCharts"
import { VentasReporteFilters } from "@/components/reportes/ventas/VentasReporteFilters"
import { useAuth } from "@/lib/auth/auth-context"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useVentaResumenReporte } from "@/lib/hooks/useVentaResumenReporte"
import type { VentaResumenReporteFiltro } from "@/lib/types/venta-resumen-reporte"

const FILTER_OPTIONS: { key: VentaResumenReporteFiltro; label: string }[] = [
  { key: "HOY", label: "Hoy" },
  { key: "ULT_7_DIAS", label: "Ultimos 7 dias" },
  { key: "ULT_14_DIAS", label: "Ultimos 14 dias" },
  { key: "ULT_30_DIAS", label: "Ultimos 30 dias" },
  
]

const NUMBER_FORMATTER = new Intl.NumberFormat("es-PE")

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

function formatPlainNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "0"
  return NUMBER_FORMATTER.format(value)
}

function buildRankingData(
  items:
    | {
        tipoComprobante?: string
        sucursal?: string
        cantidadComprobantes: number
        montoVendido: number
      }[]
    | undefined,
  labelKey: "tipoComprobante" | "sucursal",
  valueKey: "cantidadComprobantes" | "montoVendido"
): RankingChartDatum[] {
  return (items ?? []).map((item) => ({
    label: (item[labelKey] ?? "Sin nombre").trim() || "Sin nombre",
    value: item[valueKey],
  }))
}

function buildEstadoChartData(
  items:
    | {
        estado?: string
        cantidadComprobantes: number
      }[]
    | undefined
): RankingChartDatum[] {
  return (items ?? []).map((item, index) => ({
    label: (item.estado ?? "Sin estado").trim() || "Sin estado",
    value: item.cantidadComprobantes,
    color: index === 0 ? "#2563EB" : "#F97316",
  }))
}

function VentaResumenReporteSkeleton() {
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
      <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
        <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      </div>
      <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
    </div>
  )
}

export function VentasReportePage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)
  const [activeFilter, setActiveFilter] = useState<VentaResumenReporteFiltro>("ULT_30_DIAS")
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const {
    sucursalOptions,
    getSucursalOptionById,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin, "VENTA")

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
  const { data, loading, error, refresh } = useVentaResumenReporte(reportFilters, canLoadReport)

  const tipoComprobanteChartData = useMemo(
    () =>
      buildRankingData(
        data?.ventasPorTipoComprobante,
        "tipoComprobante",
        "cantidadComprobantes"
      ),
    [data?.ventasPorTipoComprobante]
  )
  const estadoChartData = useMemo(
    () => buildEstadoChartData(data?.distribucionPorEstado),
    [data?.distribucionPorEstado]
  )
  const sucursalChartData = useMemo(
    () => buildRankingData(data?.ventasPorSucursal, "sucursal", "montoVendido"),
    [data?.ventasPorSucursal]
  )
  const currentSucursalLabel = userHasSucursal
    ? user?.nombreSucursal || `Sucursal #${user?.idSucursal}`
    : null
  const ventasReporteSucursalOptions = useMemo(
    () =>
      hasValidSucursalId(selectedSucursalId) &&
      !sucursalOptions.some((option) => option.value === String(selectedSucursalId))
        ? [
            getSucursalOptionById(selectedSucursalId),
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [getSucursalOptionById, selectedSucursalId, sucursalOptions]
  )

  if (!user) return null

  if (!isAdmin && !userHasSucursal) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        No se puede generar el reporte porque tu usuario no tiene una sucursal asignada.
      </div>
    )
  }

  if (loading && !data) {
    return <VentaResumenReporteSkeleton />
  }

  return (
    <div className="space-y-6">
      <VentasReporteFilters
        activeFilter={activeFilter}
        filterOptions={FILTER_OPTIONS}
        onFilterChange={setActiveFilter}
        isAdmin={isAdmin}
        selectedSucursalId={selectedSucursalId}
        onSucursalChange={setSelectedSucursalId}
        sucursalOptions={ventasReporteSucursalOptions}
        loadingSucursales={loadingSucursales}
        errorSucursales={errorSucursales}
        searchSucursal={searchSucursal}
        onSearchSucursalChange={setSearchSucursal}
        currentSucursalLabel={currentSucursalLabel}
        loading={loading}
        onRefresh={() => {
          void refresh()
        }}
      />

      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Ventas del dia"
            value={formatMonedaPen(data.kpis.ventasDelDia)}
            icon={BanknotesIcon}
            iconColor="text-blue-600"
          />
          <MetricCard
            title="Ventas del mes"
            value={formatMonedaPen(data.kpis.ventasDelMes)}
            icon={ArrowTrendingUpIcon}
            iconColor="text-cyan-600"
          />
          <MetricCard
            title="Ticket promedio"
            value={formatMonedaPen(data.kpis.ticketPromedio)}
            icon={CreditCardIcon}
            iconColor="text-emerald-600"
          />
          <MetricCard
            title="Comprobantes"
            value={formatPlainNumber(data.kpis.cantidadComprobantes)}
            icon={ClipboardDocumentListIcon}
            iconColor="text-amber-600"
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Tendencia de monto por dia
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sigue el comportamiento del monto emitido a lo largo del periodo.
          </p>
        </div>
        <VentaTendenciaChart data={data?.tendenciaMontoPorDia ?? []} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Ventas por tipo de comprobante
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compara cuantos comprobantes emitidos aporta cada tipo.
            </p>
          </div>
          <VentaRankingBarChart
            data={tipoComprobanteChartData}
            valueType="units"
            emptyMessage="No hay comprobantes suficientes para este periodo."
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Distribucion por estado
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mide la mezcla entre comprobantes emitidos y anulados.
            </p>
          </div>
          <VentaDonutChart
            data={estadoChartData}
            valueType="units"
            emptyMessage="No hay estados suficientes para graficar."
            totalLabel="Estados"
            legendPlacement="bottom"
          />
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Ventas por sucursal
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Identifica donde se concentra el monto vendido dentro del alcance actual.
          </p>
        </div>
        <VentaRankingBarChart
          data={sucursalChartData}
          valueType="currency"
          emptyMessage="No hay sucursales con ventas para mostrar."
        />
      </section>
    </div>
  )
}
