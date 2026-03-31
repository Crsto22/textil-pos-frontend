"use client"

import { ArrowPathIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline"

import type { DashboardFiltro } from "@/lib/types/dashboard"

interface DashboardFilterOption {
  key: DashboardFiltro
  label: string
}

interface SucursalFilterOption {
  value: string
  label: string
}

interface DashboardFiltersProps {
  activeFilter: DashboardFiltro
  filterOptions: DashboardFilterOption[]
  onFilterChange: (filter: DashboardFiltro) => void
  isAdmin: boolean
  selectedSucursalId: number | null
  onSucursalChange: (idSucursal: number | null) => void
  sucursalOptions: SucursalFilterOption[]
  loadingSucursales: boolean
  errorSucursales: string | null
  currentSucursalLabel: string | null
  loading: boolean
  onRefresh: () => void
}

export function DashboardFilters({
  activeFilter,
  filterOptions,
  onFilterChange,
  isAdmin,
  selectedSucursalId,
  onSucursalChange,
  sucursalOptions,
  loadingSucursales,
  errorSucursales,
  currentSucursalLabel,
  loading,
  onRefresh,
}: DashboardFiltersProps) {
  return (
    <section className="rounded-2xl px-5 py-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onFilterChange(option.key)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    activeFilter === option.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end xl:w-auto">
          {isAdmin ? (
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 xl:min-w-[240px] xl:flex-none">
              <select
                value={selectedSucursalId === null ? "" : String(selectedSucursalId)}
                onChange={(event) => {
                  const value = event.target.value
                  const parsed = Number(value)
                  onSucursalChange(
                    value && Number.isInteger(parsed) && parsed > 0 ? parsed : null
                  )
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                disabled={loadingSucursales}
              >
                <option value="">Todas las sucursales</option>
                {sucursalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="flex h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <BuildingStorefrontIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="truncate font-medium">
                {currentSucursalLabel ?? "Sin sucursal asignada"}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {isAdmin && errorSucursales ? (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
          No se pudo cargar el listado de sucursales. Puedes seguir usando la vista
          consolidada.
        </p>
      ) : null}
    </section>
  )
}
