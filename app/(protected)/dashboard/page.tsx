"use client"

import { useState } from "react"
import { DollarSign, Package, TrendingUp } from "lucide-react"
import { MetricCard } from "@/components/Card"
import { SalesLineChart, TopProductsBarChart } from "@/components/Charts"

type FilterKey = "hoy" | "7dias" | "30dias" | "12meses" | "dia" | null

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "7dias", label: "Últimos 7 días" },
  { key: "30dias", label: "Últimos 30 días" },
  { key: "12meses", label: "Últimos 12 meses" },
  { key: "dia", label: "Por día" },
]

// Demo data
const salesData = [
  { date: "01/02", ventas: 1200 },
  { date: "02/02", ventas: 980 },
  { date: "03/02", ventas: 1540 },
  { date: "04/02", ventas: 870 },
  { date: "05/02", ventas: 2100 },
  { date: "06/02", ventas: 1680 },
  { date: "07/02", ventas: 1920 },
]

const topProducts = [
  { name: "Polo Algodón", cantidad: 45 },
  { name: "Jean Slim Fit", cantidad: 38 },
  { name: "Camisa Formal", cantidad: 30 },
  { name: "Short Deportivo", cantidad: 24 },
  { name: "Blusa Estampada", cantidad: 19 },
]

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("7dias")

  const handleFilter = (key: FilterKey) => {
    setActiveFilter(key)
  }

  const clearFilters = () => {
    setActiveFilter(null)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilter(f.key)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeFilter === f.key
                ? "bg-[#3266E4] text-white shadow-sm"
                : "bg-white dark:bg-[oklch(0.15_0_0)] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[oklch(0.3_0_0)] hover:bg-gray-50 dark:hover:bg-white/5"
              }
            `}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={clearFilters}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Ventas Totales"
          value="S/ 10,290.00"
          icon={DollarSign}
          iconColor="text-green-600"
          trend={{ value: 12.5, label: "vs período anterior" }}
        />
        <MetricCard
          title="Productos Vendidos"
          value="156"
          icon={Package}
          iconColor="text-[#3266E4]"
          trend={{ value: 8.2, label: "vs período anterior" }}
        />
        <MetricCard
          title="Ganancias"
          value="S/ 3,420.00"
          icon={TrendingUp}
          iconColor="text-purple-600"
          trend={{ value: -2.4, label: "vs período anterior" }}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Sales line chart */}
        <div className="lg:col-span-4 bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl shadow-sm border border-gray-100 dark:border-[oklch(0.3_0_0)] p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Ventas por Fecha</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Resumen del período seleccionado</p>
          </div>
          <SalesLineChart data={salesData} />
        </div>

        {/* Top 5 products */}
        <div className="lg:col-span-3 bg-white dark:bg-[oklch(0.15_0_0)] rounded-xl shadow-sm border border-gray-100 dark:border-[oklch(0.3_0_0)] p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Top 5 Productos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Más vendidos en el período</p>
          </div>
          <TopProductsBarChart data={topProducts} />
        </div>
      </div>
    </div>
  )
}
