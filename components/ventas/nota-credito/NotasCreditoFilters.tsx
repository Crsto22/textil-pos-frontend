import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
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
import { NOTA_CREDITO_MOTIVO_OPTIONS } from "@/lib/nota-credito"
import { useCanFilterBySucursal, useCanFilterByUsuario } from "@/lib/hooks/useCanFilterByUsuario"
import { useAuth } from "@/lib/auth/auth-context"
import { isAdministratorRole } from "@/lib/auth/roles"
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
  onRefresh?: () => void
}

const PERIOD_OPTIONS: Array<{ value: NotaCreditoHistorialFilters["periodo"]; label: string }> = [
  { value: "HOY", label: "Hoy" },
  { value: "AYER", label: "Ayer" },
  { value: "SEMANA", label: "Semana" },
  { value: "MES", label: "Mes" },
  { value: "FECHA", label: "Fecha especifica" },
]

interface FilterFieldsProps {
  filters: NotaCreditoHistorialFilters
  estadoOptions: string[]
  canFilterByUsuario: boolean
  canFilterBySucursal: boolean
  selectedUsuarioValue: string
  selectedSucursalValue: string
  selectedClienteValue: string
  usuarioComboboxOptions: ComboboxOption[]
  sucursalComboboxOptions: ComboboxOption[]
  clienteComboboxOptions: ComboboxOption[]
  loadingUsuarios: boolean
  errorUsuarios: string | null
  searchUsuario: string
  setSearchUsuario: (value: string) => void
  loadingSucursales: boolean
  errorSucursales: string | null
  searchSucursal: string
  setSearchSucursal: (value: string) => void
  isAdmin: boolean
  loadingClientes: boolean
  errorClientes: string | null
  searchCliente: string
  setSearchCliente: (value: string) => void
  onChange: (next: NotaCreditoHistorialFilters) => void
}

function FilterFields({
  filters,
  estadoOptions,
  canFilterByUsuario,
  canFilterBySucursal,
  selectedUsuarioValue,
  selectedSucursalValue,
  selectedClienteValue,
  usuarioComboboxOptions,
  sucursalComboboxOptions,
  clienteComboboxOptions,
  loadingUsuarios,
  errorUsuarios,
  searchUsuario,
  setSearchUsuario,
  loadingSucursales,
  errorSucursales,
  searchSucursal,
  setSearchSucursal,
  isAdmin,
  loadingClientes,
  errorClientes,
  searchCliente,
  setSearchCliente,
  onChange,
}: FilterFieldsProps) {
  return (
    <div className="space-y-4">
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
          <label className="text-xs font-medium text-muted-foreground" htmlFor="nota-venta-referencia">
            ID venta ref.
          </label>
          <Input
            id="nota-venta-referencia"
            type="number"
            min="1"
            value={filters.idVenta ?? ""}
            onChange={(event) => {
              const parsed = Number(event.target.value)
              onChange({
                ...filters,
                idVenta:
                  event.target.value && Number.isInteger(parsed) && parsed > 0 ? parsed : null,
              })
            }}
            placeholder="Todas"
            className="h-11 text-sm"
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
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="TODOS">Motivo: Todos</option>
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
                idCliente: value && Number.isInteger(parsed) && parsed > 0 ? parsed : null,
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
          <div className="space-y-1 sm:col-span-2 xl:col-span-2">
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
              placeholder="Todas las sucursales"
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
          <label className="text-xs font-medium text-muted-foreground" htmlFor="periodo-notas-credito">
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
                className="h-11 w-full"
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
                className="h-11 w-full"
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

export function NotasCreditoFilters({
  filters,
  estadoOptions,
  totalShown,
  pageElements,
  totalElements,
  createHref,
  onChange,
  onClear,
  onRefresh,
}: NotasCreditoFiltersProps) {
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
  } = useSucursalOptions(isAdmin)

  const selectedUsuarioValue = filters.idUsuario === null ? "" : String(filters.idUsuario)
  const selectedSucursalValue = filters.idSucursal === null ? "" : String(filters.idSucursal)
  const selectedClienteValue = filters.idCliente === null ? "" : String(filters.idCliente)

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

  const clienteComboboxOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: "", label: "Todos los clientes" },
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

  const activeFiltersCount = [
    filters.search.trim() !== "",
    filters.idVenta !== null,
    filters.estado !== "TODOS",
    filters.idUsuario !== null,
    filters.idCliente !== null,
    filters.codigoMotivo !== "TODOS",
    filters.usarRangoFechas,
    !filters.usarRangoFechas && filters.periodo !== "HOY",
    filters.idSucursal !== null,
  ].filter(Boolean).length

  const fieldsProps: FilterFieldsProps = {
    filters,
    estadoOptions,
    canFilterByUsuario,
    canFilterBySucursal,
    selectedUsuarioValue,
    selectedSucursalValue,
    selectedClienteValue,
    usuarioComboboxOptions,
    sucursalComboboxOptions,
    clienteComboboxOptions,
    loadingUsuarios,
    errorUsuarios,
    searchUsuario,
    setSearchUsuario,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
    isAdmin,
    loadingClientes,
    errorClientes,
    searchCliente,
    setSearchCliente,
    onChange,
  }

  return (
    <>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-end gap-2 sm:hidden">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                title="Recargar lista"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            )}
            <Link
              href={createHref}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Nueva nota
            </Link>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Buscar nota de credito
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
                placeholder="Buscar por cliente, motivo, numero de nota o comprobante..."
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
                  {totalShown} nota(s) visibles
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
            <div className="flex items-center justify-end gap-2">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  title="Recargar lista"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
              )}
              <Link
                href={createHref}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Nueva nota de credito
              </Link>
            </div>

            <div className="mt-4">
              <FilterFields {...fieldsProps} />
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
            <SheetTitle className="text-sm">Filtros de notas de credito</SheetTitle>
            <SheetDescription className="text-xs">
              Ajusta venta, estado, motivo, cliente, usuario, sucursal y fechas.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <FilterFields {...fieldsProps} />
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando {totalShown} nota(s) de credito de {pageElements} en la pagina actual ({totalElements} total)
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
