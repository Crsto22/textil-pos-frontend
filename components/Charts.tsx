"use client"

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Cell,
} from "recharts"

/* ── Sales Line Chart ── */

interface SalesDataPoint {
    date: string
    ventas: number
}

interface SalesLineChartProps {
    data: SalesDataPoint[]
}

export function SalesLineChart({ data }: SalesLineChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    tickFormatter={(v) => `S/${v}`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "13px",
                    }}
                    formatter={(value: number | undefined) => [`S/ ${(value ?? 0).toFixed(2)}`, "Ventas"]}
                />
                <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="#3266E4"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#3266E4" }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}

/* ── Top Products Bar Chart ── */

interface ProductData {
    name: string
    cantidad: number
}

interface TopProductsBarChartProps {
    data: ProductData[]
}

const BAR_COLORS = ["#3266E4", "#5B8DEF", "#84AEF5", "#ADCFFA", "#D6E7FD"]

export function TopProductsBarChart({ data }: TopProductsBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                />
                <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "13px",
                    }}
                    formatter={(value: number | undefined) => [`${value ?? 0} unidades`, "Vendidos"]}
                />
                <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={24}>
                    {data.map((_, idx) => (
                        <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
