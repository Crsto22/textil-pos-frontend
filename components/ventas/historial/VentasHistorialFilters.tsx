import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { Input } from "@/components/ui/input"
import type { VentaHistorialFilters } from "@/lib/types/venta"

interface VentasHistorialFiltersProps {
  filters: VentaHistorialFilters
  estadoOptions: string[]
  totalShown: number
  pageElements: number
  totalElements: number
  onChange: (next: VentaHistorialFilters) => void
  onClear: () => void
}

export function VentasHistorialFilters({
  filters,
  estadoOptions,
  totalShown,
  pageElements,
  totalElements,
  onChange,
  onClear,
}: VentasHistorialFiltersProps) {
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <select
              value={filters.estado}
              onChange={(event) =>
                onChange({
                  ...filters,
                  estado: event.target.value as VentaHistorialFilters["estado"],
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

            <select
              value={filters.comprobante}
              onChange={(event) =>
                onChange({
                  ...filters,
                  comprobante: event.target.value as VentaHistorialFilters["comprobante"],
                })
              }
              className="h-10 rounded-lg border bg-background px-3 text-xs outline-none"
            >
              <option value="TODOS">Comp: Todos</option>
              <option value="TICKET">Ticket</option>
              <option value="BOLETA">Boleta</option>
              <option value="FACTURA">Factura</option>
            </select>

            <div className="flex h-10 items-center rounded-lg border bg-muted/30 px-3 text-xs text-muted-foreground">
              Comprobante y estado se filtran en la pagina actual
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground" htmlFor="fecha-desde">
              Desde
            </label>
            <Input
              id="fecha-desde"
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
            <label className="text-xs text-muted-foreground" htmlFor="fecha-hasta">
              Hasta
            </label>
            <Input
              id="fecha-hasta"
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
          </div>

          <p className="text-xs text-muted-foreground">
            Mostrando {totalShown} venta(s) de {pageElements} en la pagina actual ({totalElements} total)
          </p>
        </div>
      </div>
    </section>
  )
}
