import { useEffect, useMemo } from "react"
import Link from "next/link"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { NOTA_CREDITO_MOTIVO_OPTIONS } from "@/lib/nota-credito"
import { useCanFilterBySucursal, useCanFilterByUsuario } from "@/lib/hooks/useCanFilterByUsuario"
import { useClienteOptions } from "@/lib/hooks/useClienteOptions"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useUsuarioOptions } from "@/lib/hooks/useUsuarioOptions"
import type { NotaCreditoHistorialFilters } from "@/lib/types/nota-credito"

interface NotasCreditoFiltersProps {
  filters: NotaCreditoHistorialFilters
  estadoOptions: string[]
  totalShown: number
  pageElements: number
  totalElements: number
  createHref: string
  onChange: (next: NotaCreditoHistorialFilters) => void
  onClear: () => void
}

const PERIOD_OPTIONS: Array<{ value: NotaCreditoHistorialFilters["periodo"]; label: string }> = [
  { value: "HOY", label: "Hoy" },
  { value: "AYER", label: "Ayer" },
  { value: "SEMANA", label: "Semana" },
  { value: "MES", label: "Mes" },
  { value: "FECHA", label: "Fecha especifica" },
]

export function NotasCreditoFilters({
  filters,
  estadoOptions,
  totalShown,
  pageElements,
  totalElements,
  createHref,
  onChange,
  onClear,
}: NotasCreditoFiltersProps) {
  const canFilterByUsuario = useCanFilterByUsuario()
  const canFilterBySucursal = useCanFilterBySucursal()

  const {
    clienteOptions,
    loadingClientes,
    errorClientes,
    searchCliente,
    setSearchCliente,
  } = useClienteOptions(true)
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
  } = useSucursalOptions(canFilterBySucursal)

  const selectedUsuarioValue = filters.idUsuario === null ? "" : String(filters.idUsuario)
  const selectedSucursalValue =
    filters.idSucursal === null ? "" : String(filters.idSucursal)
  const selectedClienteValue = filters.idCliente === null ? "" : String(filters.idCliente)

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
      {
        value: "",
        label: "Todas las sucursales",
      },
      ...(
        selectedSucursalValue &&
        !sucursalOptions.some((option) => option.value === selectedSucursalValue)
          ? [getSucursalOptionById(Number(selectedSucursalValue))]
          : []
      ),
      ...sucursalOptions,
    ],
    [getSucursalOptionById, selectedSucursalValue, sucursalOptions]
  )

  const clienteComboboxOptions = useMemo<ComboboxOption[]>(
    () => [
      {
        value: "",
        label: "Todos los clientes",
      },
      ...(
        selectedClienteValue &&
        !clienteOptions.some((option) => option.value === selectedClienteValue)
          ? [{ value: selectedClienteValue, label: `Cliente #${selectedClienteValue}` }]
          : []
      ),
      ...clienteOptions,
    ],
    [clienteOptions, selectedClienteValue]
  )

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link
              href={createHref}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Nueva nota de credito
            </Link>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Buscar nota de credito
            </label>
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
                placeholder="Buscar por cliente, motivo, numero de nota o comprobante referenciado..."
                className="h-10 pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="venta-referencia">
                ID venta ref.
              </label>
              <Input
                id="venta-referencia"
                type="number"
                min="1"
                value={filters.idVenta ?? ""}
                onChange={(event) => {
                  const parsed = Number(event.target.value)
                  onChange({
                    ...filters,
                    idVenta:
                      event.target.value && Number.isInteger(parsed) && parsed > 0
                        ? parsed
                        : null,
                  })
                }}
                placeholder="Todas"
                className="h-10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <select
                value={filters.estado}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    estado: event.target.value as NotaCreditoHistorialFilters["estado"],
                  })
                }
                className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none"
              >
                <option value="TODOS">Todos los estados</option>
                {estadoOptions.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Motivo SUNAT</label>
              <select
                value={filters.codigoMotivo}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    codigoMotivo: event.target.value as NotaCreditoHistorialFilters["codigoMotivo"],
                  })
                }
                className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none"
              >
                <option value="TODOS">Todos los motivos</option>
                {NOTA_CREDITO_MOTIVO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} - {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cliente</label>
              <Combobox
                value={selectedClienteValue}
                options={clienteComboboxOptions}
                searchValue={searchCliente}
                onSearchValueChange={setSearchCliente}
                onValueChange={(value) => {
                  const parsed = Number(value)
                  onChange({
                    ...filters,
                    idCliente:
                      value && Number.isInteger(parsed) && parsed > 0 ? parsed : null,
                  })
                }}
                placeholder="Todos los clientes"
                searchPlaceholder="Buscar cliente..."
                emptyMessage="No se encontraron clientes"
                loading={loadingClientes}
              />
              {errorClientes && <p className="text-[11px] text-red-500">{errorClientes}</p>}
            </div>

            {canFilterByUsuario && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Usuario</label>
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
                  placeholder="Todos los usuarios"
                  searchPlaceholder="Buscar usuario..."
                  emptyMessage="No se encontraron usuarios"
                  loading={loadingUsuarios}
                />
                {errorUsuarios && <p className="text-[11px] text-red-500">{errorUsuarios}</p>}
              </div>
            )}

            {canFilterBySucursal && (
              <div className="space-y-1 xl:col-span-2">
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
                      idSucursal:
                        value && Number.isInteger(parsed) && parsed > 0 ? parsed : null,
                    })
                  }}
                  placeholder="Todas las sucursales"
                  searchPlaceholder="Buscar sucursal..."
                  emptyMessage="No se encontraron sucursales"
                  loading={loadingSucursales}
                />
                {errorSucursales && (
                  <p className="text-[11px] text-red-500">{errorSucursales}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="periodo-notas-credito"
              >
                Periodo
              </label>
              <select
                id="periodo-notas-credito"
                value={filters.periodo}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    periodo: event.target.value as NotaCreditoHistorialFilters["periodo"],
                  })
                }
                disabled={filters.usarRangoFechas}
                className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {PERIOD_OPTIONS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Tipo de fecha
              </label>
              <label className="inline-flex h-10 w-full items-center gap-2 rounded-lg border bg-background px-3 text-xs text-muted-foreground">
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
            </div>

            {filters.usarRangoFechas ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="nota-fecha-desde">
                    Desde
                  </label>
                  <Input
                    id="nota-fecha-desde"
                    type="date"
                    value={filters.fechaDesde}
                    onChange={(event) =>
                      onChange({
                        ...filters,
                        fechaDesde: event.target.value,
                      })
                    }
                    className="h-10 w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="nota-fecha-hasta">
                    Hasta
                  </label>
                  <Input
                    id="nota-fecha-hasta"
                    type="date"
                    value={filters.fechaHasta}
                    onChange={(event) =>
                      onChange({
                        ...filters,
                        fechaHasta: event.target.value,
                      })
                    }
                    className="h-10 w-full"
                  />
                </div>
              </>
            ) : filters.periodo === "FECHA" ? (
              <div className="space-y-1 xl:col-span-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="nota-fecha-unica">
                  Fecha
                </label>
                <Input
                  id="nota-fecha-unica"
                  type="date"
                  value={filters.fecha}
                  onChange={(event) =>
                    onChange({
                      ...filters,
                      fecha: event.target.value,
                    })
                  }
                  className="h-10 w-full"
                />
              </div>
            ) : (
              <div className="flex items-end xl:col-span-2">
                <p className="text-xs text-muted-foreground">
                  El periodo seleccionado aplica filtro automatico
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                Estado se filtra en la pagina actual
              </p>
              <p className="text-xs text-muted-foreground">
                Mostrando {totalShown} nota(s) de credito de {pageElements} en la pagina actual ({totalElements} total)
              </p>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
