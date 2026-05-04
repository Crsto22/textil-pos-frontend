"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import {
  ProductRankingBarChart,
  type RankingChartDatum,
} from "@/components/reportes/productos/ProductoReporteCharts"
import type {
  UsuarioReporteAnulacionItem,
  UsuarioReporteEvolucionItem,
  UsuarioReporteKpiUsuarioItem,
} from "@/lib/types/usuario-reporte"

export { type RankingChartDatum }
export const UsuarioRankingBarChart = ProductRankingBarChart

interface UsuarioKpiOverviewChartProps {
  data: UsuarioReporteKpiUsuarioItem[]
  emptyMessage?: string
}

interface UsuarioAnulacionesChartProps {
  data: UsuarioReporteAnulacionItem[]
  emptyMessage?: string
}

interface UsuarioEvolucionChartProps {
  data: UsuarioReporteEvolucionItem[]
  emptyMessage?: string
}

type UsuarioEvolucionMetricKey = "monto" | "ventas" | "anulaciones" | "montoAnulado"
type UsuarioKpiMetricKey = "monto" | "ventas" | "ticketPromedio"

const NUMBER_FORMATTER = new Intl.NumberFormat("es-PE")
const COMPACT_CURRENCY_FORMATTER = new Intl.NumberFormat("es-PE", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
})
const SERIES_COLORS = ["#2563EB", "#0EA5E9", "#14B8A6", "#F59E0B", "#F97316"]

const METRIC_OPTIONS: {
  key: UsuarioEvolucionMetricKey
  label: string
}[] = [
  { key: "monto", label: "Monto" },
  { key: "ventas", label: "Ventas" },
  { key: "anulaciones", label: "Anulaciones" },
  { key: "montoAnulado", label: "Monto anulado" },
]

const USER_KPI_OPTIONS: {
  key: UsuarioKpiMetricKey
  label: string
}[] = [
  { key: "monto", label: "Monto" },
  { key: "ventas", label: "Ventas" },
  { key: "ticketPromedio", label: "Ticket promedio" },
]

function formatPlainNumber(value: number): string {
  if (!Number.isFinite(value)) return "0"
  return NUMBER_FORMATTER.format(value)
}

function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value)) return "S/ 0"
  return `S/ ${COMPACT_CURRENCY_FORMATTER.format(value)}`
}

function formatIsoShortDate(value: string): string {
  const rawDate = value.trim().slice(0, 10)
  const [year, month, day] = rawDate.split("-").map(Number)
  if (!year || !month || !day) return value
  return SHORT_DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)))
}

function truncateLabel(value: string, maxLength = 18): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1)}...`
}

function formatMetricValue(
  value: number,
  metric: UsuarioEvolucionMetricKey
): string {
  return metric === "monto" || metric === "montoAnulado"
    ? formatMonedaPen(value)
    : formatPlainNumber(value)
}

function formatAxisMetricValue(
  value: number,
  metric: UsuarioEvolucionMetricKey
): string {
  return metric === "monto" || metric === "montoAnulado"
    ? formatCompactCurrency(value)
    : formatPlainNumber(value)
}

function EmptyState({
  message,
  height = "h-[280px]",
}: {
  message: string
  height?: string
}) {
  return (
    <div className={`flex ${height} items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400`}>
      {message}
    </div>
  )
}

export function UsuarioKpiOverviewChart({
  data,
  emptyMessage = "No hay usuarios con actividad para mostrar KPIs.",
}: UsuarioKpiOverviewChartProps) {
  const [activeMetric, setActiveMetric] = useState<UsuarioKpiMetricKey>("monto")
  const chartData = useMemo(
    () =>
      data.slice(0, 8).map((item) => ({
        label: item.usuario,
        value: item[activeMetric],
      })),
    [activeMetric, data]
  )
  const valueType = activeMetric === "ventas" ? "units" : "currency"

  if (chartData.length === 0) {
    return <EmptyState message={emptyMessage} height="h-[220px]" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {USER_KPI_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setActiveMetric(option.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeMetric === option.key
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ProductRankingBarChart
        data={chartData}
        valueType={valueType}
        emptyMessage={emptyMessage}
      />
    </div>
  )
}

export function UsuarioAnulacionesChart({
  data,
  emptyMessage = "No hay anulaciones registradas en el periodo seleccionado.",
}: UsuarioAnulacionesChartProps) {
  const chartData = data.slice(0, 8).map((item) => ({
    label: item.usuario,
    shortLabel: truncateLabel(item.usuario, 16),
    anulaciones: item.anulaciones,
    montoAnulado: item.montoAnulado,
  }))

  const hasData = chartData.some(
    (item) => item.anulaciones > 0 || item.montoAnulado > 0
  )

  if (chartData.length === 0 || !hasData) {
    return <EmptyState message={emptyMessage} height="h-[220px]" />
  }

  return (
    <div className="space-y-4">
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 12, fill: "#64748B" }}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCompactCurrency(Number(value))}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
              }}
              labelFormatter={(label) => String(label ?? "")}
              formatter={(value, name) =>
                name === "montoAnulado"
                  ? [formatMonedaPen(Number(value)), "Monto anulado"]
                  : [formatPlainNumber(Number(value)), "Anulaciones"]
              }
            />
            <Bar
              yAxisId="left"
              dataKey="anulaciones"
              fill="#F97316"
              radius={[8, 8, 0, 0]}
              maxBarSize={38}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="montoAnulado"
              stroke="#2563EB"
              strokeWidth={3}
              dot={{ r: 4, fill: "#2563EB" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          Anulaciones
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          Monto anulado
        </div>
      </div>
    </div>
  )
}

export function UsuarioEvolucionChart({
  data,
  emptyMessage = "No hay puntos diarios suficientes para construir la evolucion.",
}: UsuarioEvolucionChartProps) {
  const [activeMetric, setActiveMetric] = useState<UsuarioEvolucionMetricKey>("monto")

  const series = useMemo(
    () =>
      data.slice(0, 5).map((item, index) => ({
        key: `usuario_${item.idUsuario ?? index}`,
        label: item.usuario,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
        points: item.puntos,
      })),
    [data]
  )

  const chartData = useMemo(() => {
    const pointsByDate = new Map<
      string,
      { fecha: string; label: string; [key: string]: number | string }
    >()

    series.forEach((serie) => {
      serie.points.forEach((point) => {
        const existing =
          pointsByDate.get(point.fecha) ??
          {
            fecha: point.fecha,
            label: formatIsoShortDate(point.fecha),
          }

        existing[serie.key] = point[activeMetric]
        pointsByDate.set(point.fecha, existing)
      })
    })

    return Array.from(pointsByDate.values()).sort((left, right) =>
      String(left.fecha).localeCompare(String(right.fecha))
    )
  }, [activeMetric, series])

  if (series.length === 0 || chartData.length === 0) {
    return <EmptyState message={emptyMessage} height="h-[340px]" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {METRIC_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setActiveMetric(option.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeMetric === option.key
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#64748B" }}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                formatAxisMetricValue(Number(value), activeMetric)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
              }}
              labelFormatter={(label) => String(label ?? "")}
              formatter={(value, name) => [
                formatMetricValue(Number(value), activeMetric),
                name,
              ]}
            />
            {series.map((serie) => (
              <Line
                key={serie.key}
                type="monotone"
                dataKey={serie.key}
                name={serie.label}
                stroke={serie.color}
                strokeWidth={3}
                dot={{ r: 3, fill: serie.color }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3">
        {series.map((serie) => (
          <div
            key={`${serie.key}-legend`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: serie.color }}
            />
            {serie.label}
          </div>
        ))}
      </div>
    </div>
  )
}
