"use client"

import { Fragment, useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import type { ProductoReporteHeatmapItem } from "@/lib/types/producto-reporte"

export interface RankingChartDatum {
  label: string
  value: number
  color?: string
}

type RankingValueType = "currency" | "units"

interface ProductDonutChartProps {
  data: RankingChartDatum[]
  emptyMessage?: string
  valueType: RankingValueType
  totalLabel?: string
  legendPlacement?: "side" | "bottom"
}

interface ProductRankingAreaChartProps {
  data: RankingChartDatum[]
  valueType: RankingValueType
  emptyMessage?: string
}

interface ProductRankingBarChartProps {
  data: RankingChartDatum[]
  valueType: RankingValueType
  emptyMessage?: string
}

interface ProductVariantHeatmapProps {
  data: ProductoReporteHeatmapItem[]
  emptyMessage?: string
}

const CHART_COLORS = ["#2563EB", "#0EA5E9", "#14B8A6", "#22C55E", "#F59E0B", "#F97316"]

function useIsDarkMode(): boolean {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const update = () => {
      const byClass = document.documentElement.classList.contains("dark")
      setIsDarkMode(byClass || media.matches)
    }

    update()
    media.addEventListener("change", update)

    return () => {
      media.removeEventListener("change", update)
    }
  }, [])

  return isDarkMode
}

function getChartTheme(isDarkMode: boolean) {
  return {
    foreground: isDarkMode ? "#E2E8F0" : "#0F172A",
    mutedForeground: isDarkMode ? "#94A3B8" : "#64748B",
    border: isDarkMode ? "#334155" : "#E2E8F0",
    tooltipBg: isDarkMode ? "#0B1220" : "#FFFFFF",
    tooltipShadow: isDarkMode
      ? "0 12px 32px rgba(2, 6, 23, 0.45)"
      : "0 12px 32px rgba(15, 23, 42, 0.12)",
    pieStroke: isDarkMode ? "#020817" : "#FFFFFF",
  }
}

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("es-PE", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const PLAIN_NUMBER_FORMATTER = new Intl.NumberFormat("es-PE")

function truncateLabel(value: string, maxLength = 24): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1)}...`
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0"
  return COMPACT_NUMBER_FORMATTER.format(value)
}

function formatPlainNumber(value: number): string {
  if (!Number.isFinite(value)) return "0"
  return PLAIN_NUMBER_FORMATTER.format(value)
}

function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value)) return "S/ 0"
  return `S/ ${COMPACT_NUMBER_FORMATTER.format(value)}`
}

function formatValueByType(value: number, valueType: RankingValueType): string {
  return valueType === "currency"
    ? formatMonedaPen(value)
    : `${formatPlainNumber(value)} unidades`
}

function formatAxisValue(value: number, valueType: RankingValueType): string {
  return valueType === "currency"
    ? formatCompactCurrency(value)
    : formatCompactNumber(value)
}

function normalizeHexColor(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) return null
  if (normalized.length === 4) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
  }
  return normalized
}

function hexToRgba(hex: string | null | undefined, alpha: number): string {
  const normalized = normalizeHexColor(hex)
  if (!normalized) {
    return `rgba(37, 99, 235, ${alpha})`
  }

  const numeric = normalized.replace("#", "")
  const red = Number.parseInt(numeric.slice(0, 2), 16)
  const green = Number.parseInt(numeric.slice(2, 4), 16)
  const blue = Number.parseInt(numeric.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function ProductDonutChart({
  data,
  emptyMessage = "No hay datos suficientes para graficar.",
  valueType,
  totalLabel = "Total",
  legendPlacement = "side",
}: ProductDonutChartProps) {
  const isDarkMode = useIsDarkMode()
  const theme = getChartTheme(isDarkMode)
  const chartData = data.slice(0, 6)

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  const total = chartData.reduce((accumulator, item) => accumulator + item.value, 0)
  const showLegendBelow = legendPlacement === "bottom"

  return (
    <div
      className={
        showLegendBelow
          ? "space-y-4"
          : "grid gap-4 xl:grid-cols-[0.9fr_1.1fr] xl:items-center"
      }
    >
      <div className={showLegendBelow ? "mx-auto h-[280px] max-w-[340px]" : "h-[280px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: theme.tooltipBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "14px",
                boxShadow: theme.tooltipShadow,
              }}
              labelStyle={{ color: theme.foreground }}
              itemStyle={{ color: theme.foreground }}
              formatter={(value: number | string) => [
                formatValueByType(Number(value), valueType),
                valueType === "currency" ? "Monto" : "Unidades",
              ]}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
              stroke={theme.pieStroke}
              strokeWidth={2}
            >
              {chartData.map((item, index) => (
                <Cell
                  key={`${item.label}-${index}`}
                  fill={item.color ?? CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[12px] font-medium uppercase tracking-[0.16em]"
              style={{ fill: theme.mutedForeground }}
            >
              {totalLabel}
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[20px] font-semibold"
              style={{ fill: theme.foreground }}
            >
              {valueType === "currency" ? formatCompactCurrency(total) : formatCompactNumber(total)}
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className={showLegendBelow ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
        {chartData.map((item, index) => {
          const share = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div
              key={`${item.label}-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color ?? CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {share.toFixed(1)}% del total
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {formatValueByType(item.value, valueType)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ProductRankingAreaChart({
  data,
  valueType,
  emptyMessage = "No hay datos suficientes para graficar.",
}: ProductRankingAreaChartProps) {
  const isDarkMode = useIsDarkMode()
  const theme = getChartTheme(isDarkMode)
  const chartData = data.slice(0, 8).map((item, index) => ({
    rank: `Top ${index + 1}`,
    label: item.label,
    shortLabel: truncateLabel(item.label, 18),
    value: item.value,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  const gradientId = valueType === "currency" ? "rankingAreaCurrency" : "rankingAreaUnits"

  return (
    <div className="space-y-4">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 6 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
            <XAxis
              dataKey="rank"
              tick={{ fontSize: 12, fill: theme.mutedForeground }}
              tickLine={false}
              axisLine={{ stroke: theme.border }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: theme.mutedForeground }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatAxisValue(Number(value), valueType)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.tooltipBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "14px",
                boxShadow: theme.tooltipShadow,
              }}
              labelStyle={{ color: theme.foreground }}
              itemStyle={{ color: theme.foreground }}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.label ? String(payload[0].payload.label) : ""
              }
              formatter={(value: number | string) => [
                formatValueByType(Number(value), valueType),
                valueType === "currency" ? "Monto" : "Unidades",
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2563EB"
              fill={`url(#${gradientId})`}
              strokeWidth={3}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {chartData.slice(0, 4).map((item) => (
          <div
            key={item.rank}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {item.rank}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
              {item.label}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatValueByType(item.value, valueType)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductRankingBarChart({
  data,
  valueType,
  emptyMessage = "No hay datos suficientes para graficar.",
}: ProductRankingBarChartProps) {
  const isDarkMode = useIsDarkMode()
  const theme = getChartTheme(isDarkMode)
  const chartData = data.slice(0, 8).map((item, index) => ({
    rank: `Top ${index + 1}`,
    label: item.label,
    shortLabel: truncateLabel(item.label, 28),
    value: item.value,
  }))
  const chartHeight = Math.max(320, chartData.length * 54)
  const yAxisWidth = chartData.some((item) => item.label.length > 24) ? 190 : 160

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: `${chartHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
          barCategoryGap={14}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: theme.mutedForeground }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatAxisValue(Number(value), valueType)}
          />
          <YAxis
            type="category"
            dataKey="shortLabel"
            width={yAxisWidth}
            tick={{ fontSize: 12, fill: theme.mutedForeground }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
            contentStyle={{
              backgroundColor: theme.tooltipBg,
              border: `1px solid ${theme.border}`,
              borderRadius: "14px",
              boxShadow: theme.tooltipShadow,
            }}
            labelStyle={{ color: theme.foreground }}
            itemStyle={{ color: theme.foreground }}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.label ? String(payload[0].payload.label) : ""
            }
            formatter={(value: number | string) => [
              formatValueByType(Number(value), valueType),
              valueType === "currency" ? "Monto" : "Unidades",
            ]}
          />
          <Bar
            dataKey="value"
            radius={[0, 14, 14, 0]}
            fill="#2563EB"
            maxBarSize={26}
            minPointSize={6}
          >
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value: number | string) => formatAxisValue(Number(value), valueType)}
              fill={theme.mutedForeground}
              className="text-[11px] font-medium"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ProductVariantHeatmap({
  data,
  emptyMessage = "No hay cruces de talla y color con ventas en este periodo.",
}: ProductVariantHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  const tallas: string[] = []
  const colores: { color: string; codigoColor: string | null }[] = []
  const matrix = new Map<string, ProductoReporteHeatmapItem>()
  const rowTotals = new Map<string, number>()

  data.forEach((item) => {
    if (!tallas.includes(item.talla)) {
      tallas.push(item.talla)
    }

    if (!colores.some((entry) => entry.color === item.color)) {
      colores.push({ color: item.color, codigoColor: item.codigoColor })
    }

    matrix.set(`${item.color}::${item.talla}`, item)
    rowTotals.set(item.color, (rowTotals.get(item.color) ?? 0) + item.unidadesVendidas)
  })

  const maxUnits = Math.max(...data.map((item) => item.unidadesVendidas), 1)

  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="grid min-w-[700px] gap-2"
        style={{
          gridTemplateColumns: `200px repeat(${tallas.length}, minmax(92px, 1fr))`,
        }}
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
          Color / talla
        </div>
        {tallas.map((talla) => (
          <div
            key={talla}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400"
          >
            {talla}
          </div>
        ))}

        {colores.map((row) => (
          <Fragment key={row.color}>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900/50">
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-white/70 shadow-sm"
                style={{ backgroundColor: normalizeHexColor(row.codigoColor) ?? "#94A3B8" }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {row.color}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatPlainNumber(rowTotals.get(row.color) ?? 0)} unidades
                </p>
              </div>
            </div>

            {tallas.map((talla) => {
              const cell = matrix.get(`${row.color}::${talla}`)
              const intensity = cell
                ? Math.max(0.18, Math.min(0.88, cell.unidadesVendidas / maxUnits))
                : 0

              return (
                <div
                  key={`${row.color}-${talla}`}
                  className="flex min-h-[92px] flex-col justify-between rounded-xl border px-3 py-3 transition-transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: cell
                      ? hexToRgba(cell.codigoColor, 0.14 + intensity * 0.56)
                      : "hsl(var(--muted) / 0.35)",
                    borderColor: cell
                      ? hexToRgba(cell.codigoColor, 0.38)
                      : "hsl(var(--border))",
                  }}
                >
                  {cell ? (
                    <>
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {formatCompactNumber(cell.unidadesVendidas)}
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          unidades
                        </p>
                      </div>
                      <p className="text-xs font-medium text-foreground">
                        {formatMonedaPen(cell.montoVendido)}
                      </p>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
                      0
                    </div>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
