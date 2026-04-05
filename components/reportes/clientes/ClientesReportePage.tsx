"use client"

import { useMemo, useState } from "react"
import {
  ArrowTrendingUpIcon,
  UserPlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline"

import { MetricCard } from "@/components/Card"
import {
  ClienteCohortChart,
  ClienteDonutChart,
  ClienteRankingBarChart,
  ClienteRfmScatterChart,
  type RankingChartDatum,
} from "@/components/reportes/clientes/ClienteReporteCharts"
import { ClientesReporteFilters } from "@/components/reportes/clientes/ClientesReporteFilters"
import { useAuth } from "@/lib/auth/auth-context"
import { useClienteReporte } from "@/lib/hooks/useClienteReporte"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { ClienteReporteFiltro } from "@/lib/types/cliente-reporte"

const FILTER_OPTIONS: { key: ClienteReporteFiltro; label: string }[] = [
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

function formatPercentage(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "0.00%"
  return `${value.toFixed(2)}%`
}

function buildRankingData(
  items:
    | {
        cliente?: string
        compras: number
        totalGastado: number
      }[]
    | undefined,
  valueKey: "compras" | "totalGastado"
): RankingChartDatum[] {
  return (items ?? []).map((item) => ({
    label: (item.cliente ?? "Cliente sin nombre").trim() || "Cliente sin nombre",
    value: item[valueKey],
  }))
}

function ClienteReporteSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
        <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
        <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      </div>
    </div>
  )
}

export function ClientesReportePage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)
  const [activeFilter, setActiveFilter] = useState<ClienteReporteFiltro>("ULT_30_DIAS")
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const {
    sucursalOptions,
    getSucursalOptionById,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin)

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
  const { data, loading, error, refresh } = useClienteReporte(reportFilters, canLoadReport)

  const comprasChartData = useMemo(
    () => buildRankingData(data?.topClientesPorCompras, "compras"),
    [data?.topClientesPorCompras]
  )
  const montoChartData = useMemo(
    () => buildRankingData(data?.topClientesPorMonto, "totalGastado"),
    [data?.topClientesPorMonto]
  )
  const currentSucursalLabel = userHasSucursal
    ? user?.nombreSucursal || `Sucursal #${user?.idSucursal}`
    : null
  const clientesReporteSucursalOptions = useMemo(
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
    return <ClienteReporteSkeleton />
  }

  return (
    <div className="space-y-6">
      <ClientesReporteFilters
        activeFilter={activeFilter}
        filterOptions={FILTER_OPTIONS}
        onFilterChange={setActiveFilter}
        isAdmin={isAdmin}
        selectedSucursalId={selectedSucursalId}
        onSucursalChange={setSelectedSucursalId}
        sucursalOptions={clientesReporteSucursalOptions}
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
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Clientes activos"
            value={formatPlainNumber(data.kpis.clientesActivos)}
            icon={UsersIcon}
            iconColor="text-blue-600"
          />
          <MetricCard
            title="Clientes nuevos del mes"
            value={formatPlainNumber(data.kpis.clientesNuevosMes)}
            icon={UserPlusIcon}
            iconColor="text-cyan-600"
          />
          <MetricCard
            title="Recurrencia"
            value={formatPercentage(data.kpis.recurrenciaPct)}
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
              Top clientes por compras
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Identifica a quienes vuelven con mayor frecuencia en el periodo.
            </p>
          </div>
          <ClienteRankingBarChart
            data={comprasChartData}
            valueType="units"
            emptyMessage="No hay compras suficientes para ranking de clientes."
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Top clientes por monto
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Muestra la participacion de quienes mas valor generan.
            </p>
          </div>
          <ClienteDonutChart
            data={montoChartData}
            valueType="currency"
            emptyMessage="No hay montos para mostrar en este periodo."
            totalLabel="Monto"
            legendPlacement="bottom"
          />
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Cohorte semanal
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compara clientes nuevos, recompra y la tasa semanal de retorno.
            </p>
          </div>
          <ClienteCohortChart data={data?.cohorteSemanal ?? []} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Mapa RFM
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Relaciona recencia, frecuencia y monto para ubicar clientes clave.
            </p>
          </div>
          <ClienteRfmScatterChart data={data?.segmentacionRfm ?? []} />
        </section>
      </div>
    </div>
  )
}
