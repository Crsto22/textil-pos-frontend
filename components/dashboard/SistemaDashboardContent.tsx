"use client"

import {
  CircleStackIcon,
  CpuChipIcon,
  ServerIcon,
  CloudIcon,
  UsersIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  FolderIcon,
} from "@heroicons/react/24/outline"
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid"

import {
  ProductDonutChart,
  ProductRankingBarChart,
  type RankingChartDatum,
} from "@/components/reportes/productos/ProductoReporteCharts"
import type {
  DashboardSistemaData,
  DashboardSistemaAlerta,
} from "@/lib/types/dashboard"

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return iso
  }
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
          {subtitle ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}

function MetricRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0 dark:border-slate-800">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`text-xs font-semibold text-slate-900 dark:text-white ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  )
}

function ProgressBar({
  percent,
  colorClass = "bg-blue-500",
}: {
  percent: number
  colorClass?: string
}) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

function AlertaBadge({ alerta }: { alerta: DashboardSistemaAlerta }) {
  const ok = alerta.estado === "OK"
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${
        ok
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
          : "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10"
      }`}
    >
      {ok ? (
        <CheckCircleIconSolid className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
      )}
      <div className="min-w-0">
        <p
          className={`text-xs font-semibold ${ok ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}
        >
          {alerta.componente}
        </p>
        <p className="truncate text-xs text-slate-600 dark:text-slate-400">{alerta.mensaje}</p>
      </div>
    </div>
  )
}

export function SistemaDashboardContent({ data }: { data: DashboardSistemaData }) {
  const memPercent = data.runtime.memoryUsedPercent
  const diskUsedPercent = 100 - data.disk.freePercent

  const usuariosChartData: RankingChartDatum[] = data.usuarios.activosPorRol.map((r) => ({
    label: r.rol,
    value: r.total,
  }))

  const sunatJobsChartData: RankingChartDatum[] = data.sunat.jobsPorEstado.map((j) => ({
    label: j.estado,
    value: j.total,
  }))

  const tablasChartData: RankingChartDatum[] = data.database.tablasMasPesadas.map((t) => ({
    label: t.tableName,
    value: t.sizeMb,
  }))

  const carpetasChartData: RankingChartDatum[] = data.storage.carpetas.map((c) => ({
    label: c.carpeta,
    value: c.bytes / 1024,
  }))

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner */}
      <div className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-500/30 dark:bg-violet-500/10">
        <ServerIcon className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
            Dashboard Sistema — {data.runtime.applicationName}
          </span>
          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
            Generado {formatDate(data.generadoEn)}
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
          Java {data.runtime.javaVersion}
        </span>
      </div>

      {/* Alertas */}
      {data.alertas.length > 0 ? (
        <SectionCard
          title="Estado del sistema"
          subtitle="Alertas y componentes monitoreados"
          icon={BellAlertIcon}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {data.alertas.map((alerta, i) => (
              <AlertaBadge key={i} alerta={alerta} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* Runtime + Disco */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <SectionCard
          title="Runtime JVM"
          subtitle={`Uptime: ${data.runtime.uptimeLegible}`}
          icon={CpuChipIcon}
        >
          <MetricRow label="Procesadores" value={String(data.runtime.processors)} />
          <MetricRow label="Memoria usada" value={data.runtime.memoryUsedLegible} />
          <MetricRow label="Memoria libre" value={data.runtime.memoryFreeLegible} />
          <MetricRow label="Memoria maxima" value={data.runtime.memoryMaxLegible} />
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Uso de memoria</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {memPercent.toFixed(1)}%
              </span>
            </div>
            <ProgressBar
              percent={memPercent}
              colorClass={
                memPercent > 80
                  ? "bg-rose-500"
                  : memPercent > 60
                    ? "bg-amber-500"
                    : "bg-blue-500"
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="Disco" subtitle={data.disk.path} icon={ServerIcon}>
          <MetricRow label="Total" value={data.disk.totalLegible} />
          <MetricRow label="Usado" value={data.disk.usedLegible} />
          <MetricRow label="Libre" value={data.disk.freeLegible} />
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Espacio usado</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {diskUsedPercent.toFixed(1)}%
              </span>
            </div>
            <ProgressBar
              percent={diskUsedPercent}
              colorClass={
                diskUsedPercent > 85
                  ? "bg-rose-500"
                  : diskUsedPercent > 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }
            />
          </div>
        </SectionCard>
      </div>

      {/* Usuarios por rol + SUNAT jobs por estado — charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <SectionCard
          title="Usuarios activos por rol"
          subtitle={`${data.usuarios.activos} activos · ${data.usuarios.eliminados} eliminados`}
          icon={UsersIcon}
        >
          <ProductDonutChart
            data={usuariosChartData}
            valueType="units"
            totalLabel="Roles"
            legendPlacement="bottom"
            emptyMessage="Sin datos de usuarios por rol."
          />
        </SectionCard>

        <SectionCard
          title="SUNAT Jobs por estado"
          subtitle={`${data.sunat.totalJobs} totales · ${data.sunat.jobsNoFinalizados} pendientes`}
          icon={CloudIcon}
        >
          <ProductDonutChart
            data={sunatJobsChartData}
            valueType="units"
            totalLabel="Jobs"
            legendPlacement="bottom"
            emptyMessage="Sin jobs SUNAT registrados."
          />
          {data.sunat.ultimoJob ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Ultimo job
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {data.sunat.ultimoJob.estado}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {data.sunat.ultimoJob.tipoDocumento}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <ClockIcon className="h-3 w-3" />
                {formatDate(data.sunat.ultimoJob.fechaActualizacion)}
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>

      {/* DB tablas + Storage carpetas — bar charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <SectionCard
          title="Tablas mas pesadas"
          subtitle={`${data.database.tablesCount} tablas · ${data.database.sizeMb.toFixed(2)} MB total`}
          icon={CircleStackIcon}
        >
          <ProductRankingBarChart
            data={tablasChartData}
            valueType="units"
            emptyMessage="Sin datos de tablas."
          />
        </SectionCard>

        <SectionCard
          title="Storage por carpeta"
          subtitle={`${data.storage.totalArchivos} archivos · ${data.storage.totalLegible} total`}
          icon={FolderIcon}
        >
          <ProductRankingBarChart
            data={carpetasChartData}
            valueType="units"
            emptyMessage="Sin carpetas en storage."
          />
        </SectionCard>
      </div>
    </div>
  )
}
