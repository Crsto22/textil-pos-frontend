"use client"

import { useState } from "react"
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { DashboardFiltro } from "@/lib/types/dashboard"

interface DashboardFilterOption {
  key: DashboardFiltro
  label: string
}

interface DashboardFiltersProps {
  activeFilter: DashboardFiltro
  filterOptions: DashboardFilterOption[]
  onFilterChange: (filter: DashboardFiltro) => void
  useCustomRange: boolean
  onUseCustomRangeChange: (value: boolean) => void
  fechaDesde: string
  onFechaDesdeChange: (value: string) => void
  fechaHasta: string
  onFechaHastaChange: (value: string) => void
  isAdmin: boolean
  hasMultipleSucursales?: boolean
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

const MOBILE_FILTERS: DashboardFilterOption[] = [
  { key: "HOY", label: "Hoy" },
  { key: "ULT_7_DIAS", label: "7 días" },
]

export function DashboardFilters({
  activeFilter,
  filterOptions,
  onFilterChange,
  useCustomRange,
  onUseCustomRangeChange,
  fechaDesde,
  onFechaDesdeChange,
  fechaHasta,
  onFechaHastaChange,
  isAdmin,
  hasMultipleSucursales = false,
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
}: DashboardFiltersProps) {
  const [showDateModal, setShowDateModal] = useState(false)
  const [modalDesde, setModalDesde] = useState(fechaDesde)
  const [modalHasta, setModalHasta] = useState(fechaHasta)

  function openDateModal() {
    setModalDesde(fechaDesde)
    setModalHasta(fechaHasta)
    setShowDateModal(true)
  }

  function applyDateRange() {
    onFechaDesdeChange(modalDesde)
    onFechaHastaChange(modalHasta)
    onUseCustomRangeChange(true)
    setShowDateModal(false)
  }

  return (
    <>
      {/* Sheet rango de fechas — solo mobile */}
      <Sheet open={showDateModal} onOpenChange={setShowDateModal}>
        <SheetContent side="bottom" className="sm:hidden rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle className="text-base">Rango de fechas</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-desde" className="text-xs text-muted-foreground">
                Desde
              </Label>
              <Input
                id="modal-desde"
                type="date"
                value={modalDesde}
                onChange={(e) => setModalDesde(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modal-hasta" className="text-xs text-muted-foreground">
                Hasta
              </Label>
              <Input
                id="modal-hasta"
                type="date"
                value={modalHasta}
                onChange={(e) => setModalHasta(e.target.value)}
              />
            </div>
          </div>

          <SheetFooter className="mt-5">
            <Button className="w-full" onClick={applyDateRange}>
              Aplicar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <section className="rounded-2xl px-5 py-4">
        {/* ─── Layout MOBILE ─── */}
        <div className="flex flex-col gap-3 sm:hidden">
          <div className="flex items-center gap-2">
            {MOBILE_FILTERS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  onFilterChange(option.key)
                  onUseCustomRangeChange(false)
                }}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  activeFilter === option.key && !useCustomRange
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}

            <button
              type="button"
              onClick={openDateModal}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                useCustomRange
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              {useCustomRange ? "Personalizado" : "Rango"}
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Sucursal en mobile */}
          {isAdmin || hasMultipleSucursales ? (
            <Combobox
              value={selectedSucursalId === null ? "" : String(selectedSucursalId)}
              options={isAdmin ? [{ value: "", label: "Todas las sucursales" }, ...sucursalOptions] : sucursalOptions}
              searchValue={searchSucursal}
              onSearchValueChange={onSearchSucursalChange}
              onValueChange={(value) => {
                const parsed = Number(value)
                onSucursalChange(
                  value && Number.isInteger(parsed) && parsed > 0 ? parsed : null
                )
              }}
              placeholder={isAdmin ? "Todas las sucursales" : "Seleccionar sucursal"}
              searchPlaceholder="Buscar sucursal..."
              emptyMessage="No se encontraron sucursales"
              loading={loadingSucursales}
            />
          ) : (
            <div className="flex h-[38px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <BuildingStorefrontIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="truncate font-medium">
                {currentSucursalLabel ?? "Sin sucursal asignada"}
              </span>
            </div>
          )}

          {useCustomRange && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Período:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {fechaDesde} → {fechaHasta}
              </span>
            </p>
          )}
        </div>

        {/* ─── Layout DESKTOP ─── */}
        <div className="hidden sm:block">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
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

              <div className="grid gap-3 md:grid-cols-[220px_repeat(2,minmax(0,180px))]">
                <label className="inline-flex h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={useCustomRange}
                    onChange={(event) => onUseCustomRangeChange(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Usar rango de fechas
                </label>

                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(event) => onFechaDesdeChange(event.target.value)}
                  disabled={!useCustomRange}
                  className="h-[46px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />

                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(event) => onFechaHastaChange(event.target.value)}
                  disabled={!useCustomRange}
                  className="h-[46px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end xl:w-auto">
              {isAdmin || hasMultipleSucursales ? (
                <div className="flex min-w-0 flex-1 flex-col gap-1 xl:min-w-[260px] xl:flex-none">
                  <Combobox
                    value={selectedSucursalId === null ? "" : String(selectedSucursalId)}
                    options={isAdmin ? [{ value: "", label: "Todas las sucursales" }, ...sucursalOptions] : sucursalOptions}
                    searchValue={searchSucursal}
                    onSearchValueChange={onSearchSucursalChange}
                    onValueChange={(value) => {
                      const parsed = Number(value)
                      onSucursalChange(
                        value && Number.isInteger(parsed) && parsed > 0 ? parsed : null
                      )
                    }}
                    placeholder={isAdmin ? "Todas las sucursales" : "Seleccionar sucursal"}
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
        </div>

        {isAdmin && errorSucursales ? (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
            No se pudo cargar el listado de sucursales. Puedes seguir usando la vista
            consolidada.
          </p>
        ) : null}
      </section>
    </>
  )
}
