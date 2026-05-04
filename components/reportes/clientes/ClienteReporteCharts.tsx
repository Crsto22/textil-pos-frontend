"use client"

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import type {
  ClienteReporteCohorteItem,
  ClienteReporteRfmItem,
} from "@/lib/types/cliente-reporte"

export {
  ProductDonutChart as ClienteDonutChart,
  ProductRankingBarChart as ClienteRankingBarChart,
  type RankingChartDatum,
} from "@/components/reportes/productos/ProductoReporteCharts"

interface ClienteCohortChartProps {
  data: ClienteReporteCohorteItem[]
  emptyMessage?: string
}

interface ClienteRfmScatterChartProps {
  data: ClienteReporteRfmItem[]
  emptyMessage?: string
}

interface ScatterTooltipPayload {
  payload: {
    cliente: string
    recenciaDias: number
    frecuencia: number
    monto: number
    nroDocumento: string | null
    ultimaCompra: string | null
  }
}

const NUMBER_FORMATTER = new Intl.NumberFormat("es-PE")
const COMPACT_CURRENCY_FORMATTER = new Intl.NumberFormat("es-PE", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
})
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function formatPlainNumber(value: number): string {
  if (!Number.isFinite(value)) return "0"
  return NUMBER_FORMATTER.format(value)
}

function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value)) return "S/ 0"
  return `S/ ${COMPACT_CURRENCY_FORMATTER.format(value)}`
}

function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return "0%"
  return `${value.toFixed(2)}%`
}

function formatWeekLabel(value: string): string {
  const parts = value.split("-")
  if (parts.length === 2 && parts[1]) {
    return `Sem ${parts[1]}`
  }
  return value
}

function formatIsoShortDate(value: string): string {
  const rawDate = value.trim().slice(0, 10)
  const [year, month, day] = rawDate.split("-").map(Number)
  if (!year || !month || !day) return value
  return SHORT_DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)))
}

function formatDateTime(value: string | null): string {
  if (!value) return "Sin registro"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : DATE_TIME_FORMATTER.format(parsed)
}

export function ClienteCohortChart({
  data,
  emptyMessage = "No hay cohortes suficientes para graficar este periodo.",
}: ClienteCohortChartProps) {
  const chartData = data.slice(-8).map((item) => ({
    ...item,
    label: formatWeekLabel(item.cohorteSemana),
    inicioSemanaLabel: item.inicioSemana ? formatIsoShortDate(item.inicioSemana) : "-",
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
        <ComposedChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="label"
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
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "14px",
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
            }}
            labelFormatter={(label) => {
              const item = chartData.find((entry) => entry.label === String(label))
              if (!item) return String(label ?? "")
              return `${item.cohorteSemana} · inicio ${item.inicioSemanaLabel}`
            }}
            formatter={(value, name) => {
              if (name === "clientesNuevos") {
                return [formatPlainNumber(Number(value)), "Clientes nuevos"]
              }
              if (name === "clientesQueRecompran") {
                return [formatPlainNumber(Number(value)), "Recompran"]
              }
              return [formatPercentage(Number(value)), "Tasa recompra"]
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="clientesNuevos"
            stroke="#2563EB"
            strokeWidth={3}
            dot={{ r: 4, fill: "#2563EB" }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="clientesQueRecompran"
            stroke="#0EA5E9"
            strokeWidth={3}
            dot={{ r: 4, fill: "#0EA5E9" }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="tasaRecompraPct"
            stroke="#F59E0B"
            strokeWidth={3}
            dot={{ r: 4, fill: "#F59E0B" }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ClienteRfmScatterChart({
  data,
  emptyMessage = "No hay suficientes clientes con actividad para mapear RFM.",
}: ClienteRfmScatterChartProps) {
  const chartData = data.slice(0, 40).map((item) => ({
    ...item,
    bubbleSize: Math.max(80, Math.min(420, item.frecuencia * 14)),
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
        <ScatterChart margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            type="number"
            dataKey="recenciaDias"
            name="Recencia"
            tick={{ fontSize: 12, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}d`}
          />
          <YAxis
            type="number"
            dataKey="monto"
            name="Monto"
            tick={{ fontSize: 12, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            width={86}
            tickFormatter={(value) => formatCompactCurrency(Number(value))}
          />
          <ZAxis type="number" dataKey="bubbleSize" range={[90, 420]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={(props: any) => {
              const { active, payload } = props
              const item = payload?.[0]?.payload
              if (!active || !item) return null

              return (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                  <p className="text-sm font-semibold text-slate-900">{item.cliente}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.nroDocumento ? `Doc. ${item.nroDocumento}` : "Sin documento"}
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <p>Recencia: {formatPlainNumber(item.recenciaDias)} dias</p>
                    <p>Frecuencia: {formatPlainNumber(item.frecuencia)} compras</p>
                    <p>Monto: {formatMonedaPen(item.monto)}</p>
                    <p>Ultima compra: {formatDateTime(item.ultimaCompra)}</p>
                  </div>
                </div>
              )
            }}
          />
          <Scatter data={chartData} fill="#2563EB" fillOpacity={0.72} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
