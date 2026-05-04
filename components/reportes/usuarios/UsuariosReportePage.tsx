"use client"

import { useMemo, useState } from "react"

import {
  UsuarioAnulacionesChart,
  UsuarioEvolucionChart,
  UsuarioKpiOverviewChart,
  UsuarioRankingBarChart,
  type RankingChartDatum,
} from "@/components/reportes/usuarios/UsuarioReporteCharts"
import { UsuariosReporteFilters } from "@/components/reportes/usuarios/UsuariosReporteFilters"
import { useAuth } from "@/lib/auth/auth-context"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useUsuarioReporte } from "@/lib/hooks/useUsuarioReporte"
import type { UsuarioReporteFiltro } from "@/lib/types/usuario-reporte"

const FILTER_OPTIONS: { key: UsuarioReporteFiltro; label: string }[] = [
  { key: "HOY", label: "Hoy" },
  { key: "ULT_7_DIAS", label: "Ultimos 7 dias" },
  { key: "ULT_14_DIAS", label: "Ultimos 14 dias" },
  { key: "ULT_30_DIAS", label: "Ultimos 30 dias" },
  
]

function buildRankingData(
  items:
    | {
        usuario?: string
        ventas: number
        monto: number
      }[]
    | undefined,
  valueKey: "ventas" | "monto"
): RankingChartDatum[] {
  return (items ?? []).map((item) => ({
    label: (item.usuario ?? "Usuario").trim() || "Usuario",
    value: item[valueKey],
  }))
}

function UsuarioReporteSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-48 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
        <div className="h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      </div>
      <div className="h-[260px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      <div className="h-[400px] rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
    </div>
  )
}

export function UsuariosReportePage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const [activeFilter, setActiveFilter] = useState<UsuarioReporteFiltro>("ULT_30_DIAS")
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const {
    sucursalOptions,
    getSucursalOptionById,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin, "VENTA")

  const reportFilters = useMemo(
    () => ({
      filtro: activeFilter,
      idSucursal: selectedSucursalId,
    }),
    [activeFilter, selectedSucursalId]
  )
  const { data, loading, error, refresh } = useUsuarioReporte(reportFilters, Boolean(user) && isAdmin)

  const montoChartData = useMemo(
    () => buildRankingData(data?.rankingPorMonto, "monto"),
    [data?.rankingPorMonto]
  )
  const comprobantesChartData = useMemo(
    () => buildRankingData(data?.rankingPorComprobantes, "ventas"),
    [data?.rankingPorComprobantes]
  )
  const usuariosReporteSucursalOptions = useMemo(
    () =>
      selectedSucursalId !== null &&
      !sucursalOptions.some((option) => option.value === String(selectedSucursalId))
        ? [
            getSucursalOptionById(selectedSucursalId),
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [getSucursalOptionById, selectedSucursalId, sucursalOptions]
  )

  if (!user) return null

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        Este reporte solo esta disponible para usuarios con rol administrador.
      </div>
    )
  }

  if (loading && !data) {
    return <UsuarioReporteSkeleton />
  }

  return (
    <div className="space-y-6">
      <UsuariosReporteFilters
        activeFilter={activeFilter}
        filterOptions={FILTER_OPTIONS}
        onFilterChange={setActiveFilter}
        selectedSucursalId={selectedSucursalId}
        onSucursalChange={setSelectedSucursalId}
        sucursalOptions={usuariosReporteSucursalOptions}
        loadingSucursales={loadingSucursales}
        errorSucursales={errorSucursales}
        searchSucursal={searchSucursal}
        onSearchSucursalChange={setSearchSucursal}
        loading={loading}
        onRefresh={() => {
          void refresh()
        }}
      />

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

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            KPIs por usuario
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cambia la metrica para comparar mejor el rendimiento de cada colaborador.
          </p>
        </div>
        <UsuarioKpiOverviewChart data={data?.kpisPorUsuario ?? []} />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Ranking por monto
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compara a los usuarios por ingreso generado en el periodo.
            </p>
          </div>
          <UsuarioRankingBarChart
            data={montoChartData}
            valueType="currency"
            emptyMessage="No hay montos registrados para este periodo."
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Ranking por comprobantes
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ordena a los usuarios por cantidad de ventas registradas.
            </p>
          </div>
          <UsuarioRankingBarChart
            data={comprobantesChartData}
            valueType="units"
            emptyMessage="No hay comprobantes suficientes para construir el ranking."
          />
        </section>
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Control de anulaciones
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cruza volumen de anulaciones con impacto economico por usuario.
          </p>
        </div>
        <UsuarioAnulacionesChart data={data?.controlAnulacionesPorUsuario ?? []} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Evolucion diaria por usuario
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sigue el comportamiento diario y cambia la metrica para revisar tendencia.
          </p>
        </div>
        <UsuarioEvolucionChart data={data?.evolucionDiariaPorUsuario ?? []} />
      </section>
    </div>
  )
}
