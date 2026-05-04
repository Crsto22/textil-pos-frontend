import { useEffect, useMemo, useState } from "react"
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"

import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth/auth-context"
import { isAdministratorRole } from "@/lib/auth/roles"
import { useCanFilterBySucursal, useCanFilterByUsuario } from "@/lib/hooks/useCanFilterByUsuario"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useUsuarioOptions } from "@/lib/hooks/useUsuarioOptions"
import type { CotizacionHistorialFilters } from "@/lib/types/cotizacion"

interface CotizacionesHistorialFiltersProps {
  filters: CotizacionHistorialFilters
  estadoOptions: string[]
  totalShown: number
  pageElements: number
  totalElements: number
  onChange: (next: CotizacionHistorialFilters) => void
  onClear: () => void
}

const PERIOD_OPTIONS: Array<{ value: CotizacionHistorialFilters["periodo"]; label: string }> = [
  { value: "HOY", label: "Hoy" },
  { value: "AYER", label: "Ayer" },
  { value: "SEMANA", label: "Semana" },
  { value: "MES", label: "Mes" },
  { value: "FECHA", label: "Fecha especifica" },
]

interface FilterFieldsProps {
  filters: CotizacionHistorialFilters
  estadoOptions: string[]
  canFilterByUsuario: boolean
  canFilterBySucursal: boolean
  selectedUsuarioValue: string
  selectedSucursalValue: string
  usuarioComboboxOptions: ComboboxOption[]
  sucursalComboboxOptions: ComboboxOption[]
  loadingUsuarios: boolean
  errorUsuarios: string | null
  searchUsuario: string
  setSearchUsuario: (value: string) => void
  loadingSucursales: boolean
  errorSucursales: string | null
  searchSucursal: string
  setSearchSucursal: (value: string) => void
  isAdmin: boolean
  onChange: (next: CotizacionHistorialFilters) => void
}

function FilterFields({
  filters,
  estadoOptions,
  canFilterByUsuario,
  canFilterBySucursal,
  selectedUsuarioValue,
  selectedSucursalValue,
  usuarioComboboxOptions,
  sucursalComboboxOptions,
  loadingUsuarios,
  errorUsuarios,
  searchUsuario,
  setSearchUsuario,
  loadingSucursales,
  errorSucursales,
  searchSucursal,
  setSearchSucursal,
  isAdmin,
  onChange,
}: FilterFieldsProps) {
  return (
    <div className="space-y-4">
      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
          canFilterByUsuario
            ? canFilterBySucursal
              ? "xl:grid-cols-4"
              : "xl:grid-cols-3"
            : canFilterBySucursal
              ? "xl:grid-cols-3"
              : "xl:grid-cols-2"
        }`}
      >
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Estado</label>
          <select
            value={filters.estado}
            onChange={(event) =>
              onChange({
                ...filters,
                estado: event.target.value as CotizacionHistorialFilters["estado"],
              })
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="TODOS">Estado: Todos</option>
            {estadoOptions.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        {canFilterByUsuario && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Usuario</label>
            <Combobox
              value={selectedUsuarioValue}
              options={[{ value: "", label: "Todos los usuarios" }, ...usuarioComboboxOptions]}
              searchValue={searchUsuario}
              onSearchValueChange={setSearchUsuario}
              onValueChange={(value) => {
                const parsed = Number(value)
                onChange({
                  ...filters,
                  idUsuario: value && Number.isInteger(parsed) && parsed > 0 ? parsed : null,
                })
              }}
              placeholder="Filtrar por usuario"
              searchPlaceholder="Buscar usuario..."
              emptyMessage="No se encontraron usuarios"
              loading={loadingUsuarios}
            />
            {errorUsuarios && <p className="text-[11px] text-red-500">{errorUsuarios}</p>}
          </div>
        )}

        {canFilterBySucursal && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Sucursal</label>
            <Combobox
              value={selectedSucursalValue}
              options={sucursalComboboxOptions}
              searchValue={searchSucursal}
              onSearchValueChange={setSearchSucursal}
              onValueChange={(value) => {
                const parsed = Number(value)
                onChange({
                  ...filters,
                  idSucursal: value && Number.isInteger(parsed) && parsed > 0 ? parsed : null,
                })
              }}
              placeholder="Filtrar por sucursal"
              searchPlaceholder="Buscar sucursal..."
              emptyMessage="No se encontraron sucursales"
              loading={loadingSucursales}
            />
            {isAdmin && errorSucursales && <p className="text-[11px] text-red-500">{errorSucursales}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="periodo-cotizaciones">
            Periodo
          </label>
          <select
            id="periodo-cotizaciones"
            value={filters.periodo}
            onChange={(event) =>
              onChange({
                ...filters,
                periodo: event.target.value as CotizacionHistorialFilters["periodo"],
              })
            }
            disabled={filters.usarRangoFechas}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800"
          >
            {PERIOD_OPTIONS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo de fecha</label>
          <label className="inline-flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <input
              type="checkbox"
              checked={filters.usarRangoFechas}
              onChange={(event) =>
                onChange({
                  ...filters,
                  usarRangoFechas: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Usar rango de fechas
          </label>
        </div>

        {filters.usarRangoFechas ? (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="fecha-desde-cot">
                Desde
              </label>
              <Input
                id="fecha-desde-cot"
                type="date"
                value={filters.fechaDesde}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    fechaDesde: event.target.value,
                  })
                }
                className="h-11 w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="fecha-hasta-cot">
                Hasta
              </label>
              <Input
                id="fecha-hasta-cot"
                type="date"
                value={filters.fechaHasta}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    fechaHasta: event.target.value,
                  })
                }
                className="h-11 w-full"
              />
            </div>
          </>
        ) : filters.periodo === "FECHA" ? (
          <div className="space-y-1 xl:col-span-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="fecha-unica-cot">
              Fecha
            </label>
            <Input
              id="fecha-unica-cot"
              type="date"
              value={filters.fecha}
              onChange={(event) =>
                onChange({
                  ...filters,
                  fecha: event.target.value,
                })
              }
              className="h-11 w-full"
            />
          </div>
        ) : (
          <div className="flex items-end xl:col-span-2">
            <span className="text-xs text-muted-foreground">
              El periodo seleccionado aplica filtro automatico
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function CotizacionesHistorialFilters({
  filters,
  estadoOptions,
  totalShown,
  pageElements,
  totalElements,
  onChange,
  onClear,
}: CotizacionesHistorialFiltersProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const { user } = useAuth()
  const isAdmin = isAdministratorRole(user?.rol)
  const canFilterByUsuario = useCanFilterByUsuario()
  const canFilterBySucursal = useCanFilterBySucursal()

  const nonAdminSucursalVentaOptions = useMemo<ComboboxOption[]>(
    () =>
      !isAdmin && canFilterBySucursal && (user?.sucursalesPermitidas ?? []).length > 1
        ? (user?.sucursalesPermitidas ?? [])
            .filter((s) => !s.tipoSucursal || s.tipoSucursal === "VENTA")
            .map((s) => ({ value: String(s.idSucursal), label: s.nombreSucursal }))
        : [],
    [isAdmin, canFilterBySucursal, user?.sucursalesPermitidas],
  )

  const {
    usuarioOptions,
    loadingUsuarios,
    errorUsuarios,
    searchUsuario,
    setSearchUsuario,
  } = useUsuarioOptions(canFilterByUsuario)
  const {
    sucursalOptions,
    getSucursalOptionById,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin, "VENTA")

  const selectedUsuarioValue = filters.idUsuario === null ? "" : String(filters.idUsuario)
  const selectedSucursalValue = filters.idSucursal === null ? "" : String(filters.idSucursal)

  useEffect(() => {
    if (canFilterByUsuario || filters.idUsuario === null) return
    onChange({
      ...filters,
      idUsuario: null,
    })
  }, [canFilterByUsuario, filters, onChange])

  

  const usuarioComboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      selectedUsuarioValue &&
      !usuarioOptions.some((option) => option.value === selectedUsuarioValue)
        ? [{ value: selectedUsuarioValue, label: `Usuario #${selectedUsuarioValue}` }, ...usuarioOptions]
        : usuarioOptions,
    [selectedUsuarioValue, usuarioOptions]
  )

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
    () => {
      if (!isAdmin && nonAdminSucursalVentaOptions.length > 0) {
        return nonAdminSucursalVentaOptions
      }
      return [
        { value: "", label: "Todas las sucursales" },
        ...(
          selectedSucursalValue &&
          !sucursalOptions.some((option) => option.value === selectedSucursalValue)
            ? [getSucursalOptionById(Number(selectedSucursalValue))]
            : []
        ),
        ...sucursalOptions,
      ]
    },
    [isAdmin, nonAdminSucursalVentaOptions, getSucursalOptionById, selectedSucursalValue, sucursalOptions]
  )

  const activeFiltersCount = [
    filters.estado !== "TODOS",
    filters.idUsuario !== null,
    filters.idSucursal !== null,
    filters.usarRangoFechas,
    !filters.usarRangoFechas && filters.periodo !== "HOY",
    filters.search.trim() !== "",
  ].filter(Boolean).length

  const fieldsProps: FilterFieldsProps = {
    filters,
    estadoOptions,
    canFilterByUsuario,
    canFilterBySucursal,
    selectedUsuarioValue,
    selectedSucursalValue,
    usuarioComboboxOptions,
    sucursalComboboxOptions,
    loadingUsuarios,
    errorUsuarios,
    searchUsuario,
    setSearchUsuario,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
    isAdmin,
    onChange,
  }

  return (
    <>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Buscar cotizacion
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.search}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    search: event.target.value,
                  })
                }
                placeholder="Buscar por cliente, codigo o id..."
                className="h-11 border-slate-200 bg-white pl-10 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="sm:hidden rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Resumen
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {totalShown} cotizacion(es) visibles
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {pageElements} en pagina, {totalElements} total
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
              </button>
            </div>
          </div>

          <div className="hidden sm:block">
            <FilterFields {...fieldsProps} />
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Mostrando {totalShown} cotizacion(es) de {pageElements} en la pagina actual ({totalElements} total)
              </p>
              <button
                type="button"
                onClick={onClear}
                className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </section>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom" className="flex h-[92dvh] flex-col gap-0 p-0 sm:hidden">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Filtros de cotizaciones</SheetTitle>
            <SheetDescription className="text-xs">
              Ajusta estado, usuario, sucursal y fechas.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <FilterFields {...fieldsProps} />
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando {totalShown} cotizacion(es) de {pageElements} en la pagina actual ({totalElements} total)
              </p>
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-slate-100 px-4 py-4 dark:border-slate-700/60">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Limpiar
            </button>
            <SheetClose asChild>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Aplicar
              </button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
