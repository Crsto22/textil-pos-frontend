"use client"

import { useMemo, useState } from "react"
import {
  ArchiveBoxArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  ArrowUpTrayIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon,
  TicketIcon,
} from "@heroicons/react/24/outline"

import { MetricCard } from "@/components/Card"
import { AdminDashboardContent } from "@/components/dashboard/AdminDashboardContent"
import { DashboardFilters } from "@/components/dashboard/DashboardFilters"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"
import { SistemaDashboardContent } from "@/components/dashboard/SistemaDashboardContent"
import { formatMonedaPen } from "@/components/productos/productos.utils"
import {
  ProductRankingBarChart,
  type RankingChartDatum,
} from "@/components/reportes/productos/ProductoReporteCharts"
import { VentaTendenciaChart } from "@/components/reportes/ventas/VentaResumenCharts"
import { useAuth } from "@/lib/auth/auth-context"
import { useDashboard } from "@/lib/hooks/useDashboard"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type {
  DashboardAlmacenData,
  DashboardFiltro,
  DashboardMovimientoItem,
  DashboardTopProduct,
  DashboardVentasData,
} from "@/lib/types/dashboard"

const FILTER_OPTIONS: { key: DashboardFiltro; label: string }[] = [
  { key: "HOY", label: "Hoy" },
  { key: "ULT_7_DIAS", label: "Ultimos 7 dias" },
  { key: "ULT_14_DIAS", label: "Ultimos 14 dias" },
  { key: "ULT_30_DIAS", label: "Ultimos 30 dias" },
]

function getTodayDateValue(): string {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

function buildVariantLabel(item: DashboardTopProduct): string {
  const variant = [item.color?.trim(), item.talla?.trim()].filter(Boolean).join(" / ")
  return variant ? `${item.producto} - ${variant}` : item.producto
}

function buildTopProductsChartData(topList?: DashboardTopProduct[]): RankingChartDatum[] {
  return (topList ?? []).map((item) => ({
    label: buildVariantLabel(item),
    value: item.cantidadVendida ?? item.stock ?? 0,
  }))
}

function VentasDashboardContent({ data }: { data: DashboardVentasData }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Mis ventas totales"
          value={formatMonedaPen(data.misVentasTotales)}
          icon={CurrencyDollarIcon}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Mis productos vendidos"
          value={String(data.misProductosVendidos)}
          icon={CubeIcon}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Mi promedio de venta"
          value={formatMonedaPen(data.miPromedioVenta)}
          icon={PresentationChartLineIcon}
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Cotizaciones abiertas"
          value={String(data.misCotizacionesAbiertas)}
          icon={TicketIcon}
          iconColor="text-orange-500"
        />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
            <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
              Mis ventas por fecha
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Evolucion del monto vendido dentro del periodo actual.
            </p>
          </div>
          <VentaTendenciaChart data={data.misVentasPorFecha} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
            <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
              Top productos mas vendidos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Variantes con mejor salida en tu sucursal.
            </p>
          </div>
          <ProductRankingBarChart
            data={buildTopProductsChartData(data.topProductosMasVendidos)}
            valueType="units"
            emptyMessage="No hay productos suficientes para construir el ranking."
          />
        </section>
      </div>
    </div>
  )
}

const TIPO_MOVIMIENTO_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ENTRADA: { bg: "bg-green-100 dark:bg-green-500/10", text: "text-green-700 dark:text-green-300", label: "Entrada" },
  SALIDA: { bg: "bg-red-100 dark:bg-red-500/10", text: "text-red-700 dark:text-red-300", label: "Salida" },
  AJUSTE: { bg: "bg-amber-100 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", label: "Ajuste" },
  RESERVA: { bg: "bg-blue-100 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-300", label: "Reserva" },
  LIBERACION: { bg: "bg-purple-100 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-300", label: "Liberacion" },
  TRASLADO_ENTRADA: { bg: "bg-cyan-100 dark:bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-300", label: "Traslado Entrada" },
  TRASLADO_SALIDA: { bg: "bg-orange-100 dark:bg-orange-500/10", text: "text-orange-700 dark:text-orange-300", label: "Traslado Salida" },
}

function getTipoStyle(tipo: string) {
  return TIPO_MOVIMIENTO_STYLES[tipo] ?? { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-700 dark:text-slate-300", label: tipo }
}

function UltimosMovimientosTable({ movimientos }: { movimientos: DashboardMovimientoItem[] }) {
  if (movimientos.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        Sin movimientos recientes.
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {movimientos.map((mov, index) => {
        const style = getTipoStyle(mov.tipo)
        const variant = [mov.color?.trim(), mov.talla?.trim()].filter(Boolean).join(" / ")
        return (
          <div
            key={index}
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-700/60 dark:bg-slate-900/40"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                <span className="truncate text-xs font-medium text-slate-900 dark:text-white">
                  {mov.producto}{variant ? ` — ${variant}` : ""}
                </span>
              </div>
              {mov.motivo ? (
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{mov.motivo}</p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {mov.stockAntes} → {mov.stockDespues}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AlmacenDashboardContent({ data }: { data: DashboardAlmacenData }) {
  const resumen = data.resumenMovimientos
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Fila 1: stock */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Total fisico en tienda"
          value={String(data.totalFisicoEnTienda)}
          icon={ArchiveBoxArrowDownIcon}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Variantes disponibles"
          value={String(data.variantesDisponibles)}
          icon={CubeIcon}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Variantes agotadas"
          value={String(data.variantesAgotadas)}
          icon={ExclamationTriangleIcon}
          iconColor="text-red-600"
        />
        <MetricCard
          title="Stock bajo"
          value={String(data.stockBajo)}
          icon={ArrowTrendingUpIcon}
          iconColor="text-orange-500"
        />
      </div>

      {/* Fila 2: resumen movimientos */}
      {resumen ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            title="Total movimientos"
            value={String(resumen.totalMovimientos)}
            icon={ClipboardDocumentListIcon}
            iconColor="text-slate-500"
          />
          <MetricCard
            title="Unidades entrada"
            value={String(resumen.unidadesEntrada)}
            icon={ArrowUpTrayIcon}
            iconColor="text-green-600"
          />
          <MetricCard
            title="Unidades salida"
            value={String(resumen.unidadesSalida)}
            icon={ArrowDownTrayIcon}
            iconColor="text-red-600"
          />
          <MetricCard
            title="Traslados entrada"
            value={String(resumen.unidadesTrasladoEntrada)}
            icon={ArrowsRightLeftIcon}
            iconColor="text-cyan-600"
          />
        </div>
      ) : null}

      {/* Fila 3: reposicion urgente + top mayor salida */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
            <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
              Reposicion urgente
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Variantes con stock comprometido para revisar primero.
            </p>
          </div>
          <div className="space-y-3">
            {data.reposicionUrgente.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                No hay productos urgentes para reponer.
              </div>
            ) : (
              data.reposicionUrgente.map((prod, index) => (
                <div
                  key={`${prod.idProductoVariante ?? index}-${prod.sku ?? prod.producto}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {buildVariantLabel({
                        idProductoVariante: prod.idProductoVariante,
                        producto: prod.producto,
                        color: prod.color,
                        talla: prod.talla,
                        cantidadVendida: 0,
                        stock: prod.stock,
                        sku: prod.sku,
                      })}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      SKU: {prod.sku ?? "Sin SKU"}
                    </p>
                  </div>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    Stock {prod.stock}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
            <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
              Top mayor salida
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Variantes con mayor movimiento dentro del almacen.
            </p>
          </div>
          <ProductRankingBarChart
            data={buildTopProductsChartData(data.topMayorSalida)}
            valueType="units"
            emptyMessage="No hay datos de salida para mostrar."
          />
        </section>
      </div>

      {/* Fila 4: ultimos movimientos + top stock actual */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
            <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
              Ultimos movimientos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Los 10 movimientos mas recientes en este almacen.
            </p>
          </div>
          <UltimosMovimientosTable movimientos={data.ultimosMovimientos ?? []} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
            <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
              Top stock actual
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Variantes con mayor cantidad en este almacen.
            </p>
          </div>
          <ProductRankingBarChart
            data={buildTopProductsChartData(data.topStockActual)}
            valueType="units"
            emptyMessage="No hay stock para mostrar."
          />
        </section>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const isSistema = user?.rol === "SISTEMA"
  const isAlmacen = user?.rol === "ALMACEN"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)
  const userSucursales = user?.sucursalesPermitidas ?? []
  const hasMultipleSucursales = !isAdmin && userSucursales.length > 1

  const [activeFilter, setActiveFilter] = useState<DashboardFiltro>("HOY")
  const [useCustomRange, setUseCustomRange] = useState(false)
  const [fechaDesde, setFechaDesde] = useState(getTodayDateValue())
  const [fechaHasta, setFechaHasta] = useState(getTodayDateValue())
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(
    userHasSucursal ? user.idSucursal : null
  )

  const {
    sucursalOptions,
    getSucursalOptionById,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin)

  const nonAdminSucursalOptions = useMemo(() => {
    if (isAdmin || userSucursales.length === 0) return []
    return userSucursales.map((s) => ({
      value: String(s.idSucursal),
      label: s.nombreSucursal,
    }))
  }, [isAdmin, userSucursales])

  const resolvedSucursalId = isAdmin
    ? selectedSucursalId
    : hasMultipleSucursales
      ? selectedSucursalId
      : userHasSucursal
        ? user.idSucursal
        : null

  const dashboardFilters = useMemo(
    () => ({
      filtro: useCustomRange ? undefined : activeFilter,
      desde: useCustomRange ? fechaDesde : undefined,
      hasta: useCustomRange ? fechaHasta : undefined,
      idSucursal: resolvedSucursalId,
    }),
    [activeFilter, fechaDesde, fechaHasta, resolvedSucursalId, useCustomRange]
  )

  const { data, loading, error, refresh } = useDashboard(dashboardFilters, Boolean(user))
  const currentSucursalLabel = userHasSucursal
    ? user?.nombreSucursal || `Sucursal #${user?.idSucursal}`
    : null
  const dashboardSucursalOptions = useMemo(
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

  if (loading && !data) {
    return <DashboardSkeleton showFilters={!isAlmacen && !isSistema} />
  }

  return (
    <div className="space-y-6">
      {!isAlmacen && !isSistema ? (
        <DashboardFilters
          activeFilter={activeFilter}
          filterOptions={FILTER_OPTIONS}
          onFilterChange={(filter) => {
            setUseCustomRange(false)
            setActiveFilter(filter)
          }}
          useCustomRange={useCustomRange}
          onUseCustomRangeChange={setUseCustomRange}
          fechaDesde={fechaDesde}
          onFechaDesdeChange={setFechaDesde}
          fechaHasta={fechaHasta}
          onFechaHastaChange={setFechaHasta}
          isAdmin={isAdmin}
          hasMultipleSucursales={hasMultipleSucursales}
          selectedSucursalId={selectedSucursalId}
          onSucursalChange={setSelectedSucursalId}
          sucursalOptions={isAdmin ? dashboardSucursalOptions : nonAdminSucursalOptions}
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
          Se muestra el ultimo resultado disponible. No se pudo refrescar el dashboard:{" "}
          {error}
        </section>
      ) : null}

      {data?.dashboard === "ADMIN" ? <AdminDashboardContent data={data} /> : null}
      {data?.dashboard === "VENTAS" ? <VentasDashboardContent data={data} /> : null}
      {data?.dashboard === "ALMACEN" ? <AlmacenDashboardContent data={data} /> : null}
      {data?.dashboard === "SISTEMA" ? <SistemaDashboardContent data={data} /> : null}
    </div>
  )
}
