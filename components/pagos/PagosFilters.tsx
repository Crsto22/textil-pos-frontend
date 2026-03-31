import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { ALL_PAGO_METHOD_FILTER } from "@/components/pagos/pagos.utils"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { PAGO_PERIOD_OPTIONS } from "@/lib/pago-filters"
import { useCanFilterBySucursal, useCanFilterByUsuario } from "@/lib/hooks/useCanFilterByUsuario"
import { useMetodoPagoOptions } from "@/lib/hooks/useMetodoPagoOptions"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useUsuarioOptions } from "@/lib/hooks/useUsuarioOptions"
import { useSucursalGlobal } from "@/lib/sucursal-global-context"
import type { PagoFilters } from "@/lib/types/pago"

const ESTADO_VENTA_OPTIONS = [
  { value: "TODOS", label: "Estado venta: Todos" },
  { value: "EMITIDA", label: "Emitida" },
  { value: "ANULADA", label: "Anulada" },
  { value: "NC_EMITIDA", label: "NC emitida" },
] as const

interface PagosFiltersProps {
  filters: PagoFilters
  numberOfElements: number
  totalElements: number
  reportLoading: boolean
  onChange: (next: PagoFilters) => void
  onDownloadReport: () => void
  onClear: () => void
}

export function PagosFilters({
  filters,
  numberOfElements,
  totalElements,
  reportLoading,
  onChange,
  onDownloadReport,
  onClear,
}: PagosFiltersProps) {
  const canFilterByUsuario = useCanFilterByUsuario()
  const canFilterBySucursal = useCanFilterBySucursal()
  const { sucursalGlobal } = useSucursalGlobal()
  const filtersRef = useRef(filters)
  const onChangeRef = useRef(onChange)
  useLayoutEffect(() => {
    filtersRef.current = filters
    onChangeRef.current = onChange
  })

  // Sincronizar con sucursal global cuando cambia
  useEffect(() => {
    if (!canFilterBySucursal || sucursalGlobal === null) return
    onChangeRef.current({ ...filtersRef.current, idSucursal: sucursalGlobal.idSucursal })
  }, [sucursalGlobal, canFilterBySucursal])

  const { methodOptions, loadingMethods, errorMethods } = useMetodoPagoOptions(true)
  const {
    usuarioOptions,
    loadingUsuarios,
    errorUsuarios,
    searchUsuario,
    setSearchUsuario,
  } = useUsuarioOptions(canFilterByUsuario)
  const {
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(canFilterBySucursal)

  const selectedMethodValue =
    filters.idMetodoPago === null ? ALL_PAGO_METHOD_FILTER : String(filters.idMetodoPago)
  const selectedUsuarioValue = filters.idUsuario === null ? "" : String(filters.idUsuario)
  const selectedSucursalValue = filters.idSucursal === null ? "" : String(filters.idSucursal)

  useEffect(() => {
    if (canFilterByUsuario || filters.idUsuario === null) return
    onChange({
      ...filters,
      idUsuario: null,
    })
  }, [canFilterByUsuario, filters, onChange])

  useEffect(() => {
    if (canFilterBySucursal || filters.idSucursal === null) return
    onChange({
      ...filters,
      idSucursal: null,
    })
  }, [canFilterBySucursal, filters, onChange])

  const methodSelectOptions = useMemo<ComboboxOption[]>(
    () =>
      selectedMethodValue !== ALL_PAGO_METHOD_FILTER &&
      !methodOptions.some((option) => option.value === selectedMethodValue)
        ? [
            { value: selectedMethodValue, label: `Metodo #${selectedMethodValue}` },
            ...methodOptions,
          ]
        : methodOptions,
    [methodOptions, selectedMethodValue]
  )

  const usuarioComboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      selectedUsuarioValue &&
      !usuarioOptions.some((option) => option.value === selectedUsuarioValue)
        ? [
            { value: selectedUsuarioValue, label: `Usuario #${selectedUsuarioValue}` },
            ...usuarioOptions,
          ]
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
              placeholder="Buscar por cliente, comprobante o id..."
              className="h-10 pl-10"
            />
          </div>

          <div
            className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
              canFilterByUsuario
                ? canFilterBySucursal
                  ? "xl:grid-cols-5"
                  : "xl:grid-cols-4"
                : canFilterBySucursal
                  ? "xl:grid-cols-4"
                  : "xl:grid-cols-3"
            }`}
          >
            <div className="space-y-1">
              <select
                value={filters.estadoVenta}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    estadoVenta: event.target.value,
                  })
                }
                className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none"
              >
                {ESTADO_VENTA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <select
                value={selectedMethodValue}
                onChange={(event) => {
                  const parsed = Number(event.target.value)
                  onChange({
                    ...filters,
                    idMetodoPago:
                      event.target.value !== ALL_PAGO_METHOD_FILTER &&
                      Number.isInteger(parsed) &&
                      parsed > 0
                        ? parsed
                        : null,
                  })
                }}
                disabled={loadingMethods}
                className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value={ALL_PAGO_METHOD_FILTER}>Metodo: Todos</option>
                {methodSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errorMethods && (
                <p className="text-[11px] text-red-500">{errorMethods}</p>
              )}
            </div>

            {canFilterByUsuario && (
              <div className="space-y-1">
                <Combobox
                  value={selectedUsuarioValue}
                  options={[
                    { value: "", label: "Todos los usuarios" },
                    ...usuarioComboboxOptions,
                  ]}
                  searchValue={searchUsuario}
                  onSearchValueChange={setSearchUsuario}
                  onValueChange={(value) => {
                    const parsed = Number(value)
                    onChange({
                      ...filters,
                      idUsuario:
                        value && Number.isInteger(parsed) && parsed > 0 ? parsed : null,
                    })
                  }}
                  placeholder="Filtrar por usuario"
                  searchPlaceholder="Buscar usuario..."
                  emptyMessage="No se encontraron usuarios"
                  loading={loadingUsuarios}
                />
                {errorUsuarios && (
                  <p className="text-[11px] text-red-500">{errorUsuarios}</p>
                )}
              </div>
            )}

            {canFilterBySucursal && (
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
                      idSucursal:
                        value && Number.isInteger(parsed) && parsed > 0 ? parsed : null,
                    })
                  }}
                  placeholder="Filtrar por sucursal"
                  searchPlaceholder="Buscar sucursal..."
                  emptyMessage="No se encontraron sucursales"
                  loading={loadingSucursales}
                />
                {errorSucursales && (
                  <p className="text-[11px] text-red-500">{errorSucursales}</p>
                )}
              </div>
            )}

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
            <label className="text-xs text-muted-foreground" htmlFor="periodo-pagos">
              Periodo
            </label>
            <select
              id="periodo-pagos"
              value={filters.periodo}
              onChange={(event) =>
                onChange({
                  ...filters,
                  periodo: event.target.value as PagoFilters["periodo"],
                })
              }
              disabled={filters.usarRangoFechas}
              className="h-9 rounded-lg border bg-background px-3 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {PAGO_PERIOD_OPTIONS.map((period) => (
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
                <label className="text-xs text-muted-foreground" htmlFor="pagos-fecha-desde">
                  Desde
                </label>
                <Input
                  id="pagos-fecha-desde"
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
                <label className="text-xs text-muted-foreground" htmlFor="pagos-fecha-hasta">
                  Hasta
                </label>
                <Input
                  id="pagos-fecha-hasta"
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
                <label className="text-xs text-muted-foreground" htmlFor="pagos-fecha-unica">
                  Fecha
                </label>
                <Input
                  id="pagos-fecha-unica"
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                Los filtros se aplican sobre el listado paginado de pagos.
              </p>
              <p className="text-xs text-muted-foreground">
                Mostrando {numberOfElements} pago(s) en la pagina actual ({totalElements} total)
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadReport}
              disabled={reportLoading}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-red-700 px-4 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reportLoading ? "Descargando..." : "Reporte PDF"}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
