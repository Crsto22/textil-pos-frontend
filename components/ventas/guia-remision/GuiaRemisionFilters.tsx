import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"

import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useCanFilterBySucursal } from "@/lib/hooks/useCanFilterByUsuario"
import { useAuth } from "@/lib/auth/auth-context"
import { isAdministratorRole } from "@/lib/auth/roles"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import {
  ESTADO_OPTIONS,
  SUNAT_ESTADO_OPTIONS,
} from "@/lib/types/guia-remision"
import type { GuiaRemisionFilters as Filters } from "@/lib/types/guia-remision"

interface GuiaRemisionFiltersProps {
  filters: Filters
  totalShown: number
  pageElements: number
  totalElements: number
  onChange: (next: Filters) => void
  onClear: () => void
  onRefresh?: () => void
}

export function GuiaRemisionFilters({
  filters,
  totalShown,
  pageElements,
  totalElements,
  onChange,
  onClear,
  onRefresh,
}: GuiaRemisionFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { user } = useAuth()
  const isAdmin = isAdministratorRole(user?.rol)
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
    sucursalOptions,
    getSucursalOptionById,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin)

  const selectedSucursalValue =
    filters.idSucursal === null ? "" : String(filters.idSucursal)

  

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
    () => {
      if (!isAdmin && nonAdminSucursalVentaOptions.length > 0) {
        return nonAdminSucursalVentaOptions
      }
      return [
        { value: "", label: "Todas las sucursales" },
        ...(selectedSucursalValue &&
        !sucursalOptions.some((o) => o.value === selectedSucursalValue)
          ? [getSucursalOptionById(Number(selectedSucursalValue))]
          : []),
        ...sucursalOptions,
      ]
    },
    [isAdmin, nonAdminSucursalVentaOptions, getSucursalOptionById, selectedSucursalValue, sucursalOptions]
  )

  const activeFilterCount = [
    filters.estado !== "TODOS",
    filters.sunatEstado !== "TODOS",
    filters.idSucursal !== null,
  ].filter(Boolean).length

  const filterSelects = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Estado</label>
        <select
          value={filters.estado}
          onChange={(e) => onChange({ ...filters, estado: e.target.value as Filters["estado"] })}
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800"
        >
          <option value="TODOS">Todos los estados</option>
          {ESTADO_OPTIONS.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Estado SUNAT</label>
        <select
          value={filters.sunatEstado}
          onChange={(e) => onChange({ ...filters, sunatEstado: e.target.value as Filters["sunatEstado"] })}
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800"
        >
          <option value="TODOS">Todos</option>
          {SUNAT_ESTADO_OPTIONS.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
      </div>

      {canFilterBySucursal && (
        <div className="space-y-1.5">
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
  )

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      {/* ─── MOBILE layout ─── */}
      <div className="flex flex-col gap-3 sm:hidden">
        {/* Row 1: Search + Nueva */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="Buscar numero, documento..."
              className="h-10 pl-9 text-sm"
            />
          </div>
          <Link
            href="/ventas/guia-remision/nueva"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva
          </Link>
        </div>

        {/* Row 2: filter chip + refresh + count */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-muted-foreground transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              title="Recargar"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
          <p className="ml-auto text-xs text-muted-foreground">
            {totalElements} guia(s)
          </p>
        </div>
      </div>

      {/* ─── DESKTOP layout ─── */}
      <div className="hidden flex-col gap-4 sm:flex">
        <div className="flex items-center justify-between gap-3">
          <div className="relative min-w-0 flex-1 max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="Buscar por numero, documento o razon social..."
              className="h-10 pl-10"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-3 text-muted-foreground transition-colors hover:bg-muted"
                title="Recargar lista"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            )}
            <Link
              href="/ventas/guia-remision/nueva"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Nueva guia de remision remitente
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <select
              value={filters.estado}
              onChange={(e) => onChange({ ...filters, estado: e.target.value as Filters["estado"] })}
              className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none"
            >
              <option value="TODOS">Todos los estados</option>
              {ESTADO_OPTIONS.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Estado SUNAT</label>
            <select
              value={filters.sunatEstado}
              onChange={(e) => onChange({ ...filters, sunatEstado: e.target.value as Filters["sunatEstado"] })}
              className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none"
            >
              <option value="TODOS">Todos</option>
              {SUNAT_ESTADO_OPTIONS.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

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
                placeholder="Todas las sucursales"
                searchPlaceholder="Buscar sucursal..."
                emptyMessage="No se encontraron sucursales"
                loading={loadingSucursales}
              />
              {isAdmin && errorSucursales && <p className="text-[11px] text-red-500">{errorSucursales}</p>}
            </div>
          )}

          <div className="flex items-end">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Mostrando {totalShown} guia(s) de {pageElements} en la pagina actual ({totalElements} total)
          </p>
        </div>
      </div>

      {/* ─── MOBILE: Sheet de filtros ─── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="flex h-[80dvh] flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Filtros</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
            {filterSelects}
          </div>
          <SheetFooter className="shrink-0 border-t border-slate-100 px-4 pb-6 pt-3 dark:border-slate-700/60">
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { onClear(); setSheetOpen(false) }}
              >
                <XMarkIcon className="h-4 w-4" />
                Limpiar
              </Button>
              <SheetClose asChild>
                <Button type="button" className="flex-1">
                  Aplicar
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  )
}
