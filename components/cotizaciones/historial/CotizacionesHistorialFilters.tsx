import { useMemo } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
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

export function CotizacionesHistorialFilters({
  filters,
  estadoOptions,
  totalShown,
  pageElements,
  totalElements,
  onChange,
  onClear,
}: CotizacionesHistorialFiltersProps) {
  const {
    usuarioOptions,
    loadingUsuarios,
    errorUsuarios,
    searchUsuario,
    setSearchUsuario,
  } = useUsuarioOptions(true)
  const {
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(true)

  const selectedUsuarioValue = filters.idUsuario === null ? "" : String(filters.idUsuario)
  const selectedSucursalValue = filters.idSucursal === null ? "" : String(filters.idSucursal)

  const usuarioComboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      selectedUsuarioValue &&
      !usuarioOptions.some((option) => option.value === selectedUsuarioValue)
        ? [{ value: selectedUsuarioValue, label: `Usuario #${selectedUsuarioValue}` }, ...usuarioOptions]
        : usuarioOptions,
    [selectedUsuarioValue, usuarioOptions]
  )
  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: "", label: "Todas las sucursales" },
      ...(
        selectedSucursalValue &&
        !sucursalOptions.some((option) => option.value === selectedSucursalValue)
          ? [{ value: selectedSucursalValue, label: `Sucursal #${selectedSucursalValue}` }]
          : []
      ),
      ...sucursalOptions,
    ],
    [selectedSucursalValue, sucursalOptions]
  )

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) =>
                onChange({
                  ...filters,
                  search: event.target.value,
                })
              }
              placeholder="Buscar por cliente, codigo o id..."
              className="h-10 pl-10"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <select
              value={filters.estado}
              onChange={(event) =>
                onChange({
                  ...filters,
                  estado: event.target.value as CotizacionHistorialFilters["estado"],
                })
              }
              className="h-10 rounded-lg border bg-background px-3 text-xs outline-none"
            >
              <option value="TODOS">Estado: Todos</option>
              {estadoOptions.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>

            <div className="space-y-1">
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

            <div className="space-y-1">
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
              {errorSucursales && <p className="text-[11px] text-red-500">{errorSucursales}</p>}
            </div>

            <button
              type="button"
              onClick={onClear}
              className="h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-muted-foreground" htmlFor="periodo-cotizaciones">
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
              className="h-9 rounded-lg border bg-background px-3 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {PERIOD_OPTIONS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>

            <label className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={filters.usarRangoFechas}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    usarRangoFechas: event.target.checked,
                  })
                }
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              Usar rango de fechas
            </label>

            {filters.usarRangoFechas ? (
              <>
                <label className="text-xs text-muted-foreground" htmlFor="fecha-desde-cot">
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
                  className="h-9 w-[170px]"
                />
                <label className="text-xs text-muted-foreground" htmlFor="fecha-hasta-cot">
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
                  className="h-9 w-[170px]"
                />
              </>
            ) : filters.periodo === "FECHA" ? (
              <>
                <label className="text-xs text-muted-foreground" htmlFor="fecha-unica-cot">
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
                  className="h-9 w-[170px]"
                />
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                El periodo seleccionado aplica filtro automatico
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">
              Mostrando {totalShown} cotizacion(es) de {pageElements} en la pagina actual ({totalElements} total)
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
