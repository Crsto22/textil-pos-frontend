"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import type { VentaResumenMontoPorDiaItem } from "@/lib/types/venta-resumen-reporte"

export {
  ProductDonutChart as VentaDonutChart,
  ProductRankingBarChart as VentaRankingBarChart,
  type RankingChartDatum,
} from "@/components/reportes/productos/ProductoReporteCharts"

interface VentaTendenciaChartProps {
  data: Array<
    VentaResumenMontoPorDiaItem & {
      etiqueta?: string
      granularidad?: string
      label?: string
    }
  >
  emptyMessage?: string
}

const COMPACT_CURRENCY_FORMATTER = new Intl.NumberFormat("es-PE", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
})

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

function formatTooltipLabel(
  item:
    | (VentaResumenMontoPorDiaItem & {
        etiqueta?: string
        granularidad?: string
        label?: string
      })
    | undefined
): string {
  if (!item) return ""
  if (item.granularidad === "HORA") {
    return `${formatIsoShortDate(item.fecha)} ${item.etiqueta ?? item.label ?? ""}`.trim()
  }
  if (item.granularidad === "MES") {
    return item.etiqueta || item.label || item.fecha
  }
  return item.etiqueta || item.label || formatIsoShortDate(item.fecha)
}

export function VentaTendenciaChart({
  data,
  emptyMessage = "No hay suficiente informacion para construir la tendencia.",
}: VentaTendenciaChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    label:
      item.etiqueta ||
      item.label ||
      (item.granularidad === "HORA" ? item.fecha : formatIsoShortDate(item.fecha)),
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#64748B" }}
            tickLine={false}
            axisLine={{ stroke: "#E2E8F0" }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748B" }}
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
            labelFormatter={(label) =>
              formatTooltipLabel(
                chartData.find((item) => item.label === String(label))
              )
            }
            formatter={(value) => [
              formatMonedaPen(Number(value)),
              "Monto vendido",
            ]}
          />
          <Line
            type="monotone"
            dataKey="monto"
            stroke="#2563EB"
            strokeWidth={3}
            dot={{ r: 3, fill: "#2563EB" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
