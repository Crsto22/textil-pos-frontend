"use client"

import { ArrowPathIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline"

import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import type { ClienteReporteFiltro } from "@/lib/types/cliente-reporte"

interface ClienteReporteFilterOption {
  key: ClienteReporteFiltro
  label: string
}

interface ClientesReporteFiltersProps {
  activeFilter: ClienteReporteFiltro
  filterOptions: ClienteReporteFilterOption[]
  onFilterChange: (filter: ClienteReporteFiltro) => void
  isAdmin: boolean
  selectedSucursalId: number | null
  onSucursalChange: (idSucursal: number | null) => void
  sucursalOptions: ComboboxOption[]
  loadingSucursales: boolean
  errorSucursales: string | null
  searchSucursal: string
  onSearchSucursalChange: (value: string) => void
  currentSucursalLabel: string | null
  loading: boolean
  onRefresh: () => void
}

export function ClientesReporteFilters({
  activeFilter,
  filterOptions,
  onFilterChange,
  isAdmin,
  selectedSucursalId,
  onSucursalChange,
  sucursalOptions,
  loadingSucursales,
  errorSucursales,
  searchSucursal,
  onSearchSucursalChange,
  currentSucursalLabel,
  loading,
  onRefresh,
}: ClientesReporteFiltersProps) {
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
            <div className="flex min-w-0 flex-1 flex-col gap-1 xl:min-w-[260px] xl:flex-none">
              <Combobox
                value={selectedSucursalId === null ? "" : String(selectedSucursalId)}
                options={[{ value: "", label: "Todas las sucursales" }, ...sucursalOptions]}
                searchValue={searchSucursal}
                onSearchValueChange={onSearchSucursalChange}
                onValueChange={(value) => {
                  const parsed = Number(value)
                  onSucursalChange(
                    value && Number.isInteger(parsed) && parsed > 0 ? parsed : null
                  )
                }}
                placeholder="Todas las sucursales"
                searchPlaceholder="Buscar sucursal..."
                emptyMessage="No se encontraron sucursales"
                loading={loadingSucursales}
              />
            </div>
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
