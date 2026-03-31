import { memo } from "react"

import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ComprobantesFiltersProps {
  isAdmin: boolean
  idSucursal: number | null
  onIdSucursalChange: (value: number) => void
  activoFilter: "TODOS" | "ACTIVO" | "INACTIVO"
  onActivoFilterChange: (value: "TODOS" | "ACTIVO" | "INACTIVO") => void
  sucursalOptions: ComboboxOption[]
  loadingSucursales: boolean
  errorSucursales: string | null
  searchSucursal: string
  onSearchSucursalChange: (value: string) => void
  userSucursalLabel: string
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

function ComprobantesFiltersComponent({
  isAdmin,
  idSucursal,
  onIdSucursalChange,
  activoFilter,
  onActivoFilterChange,
  sucursalOptions,
  loadingSucursales,
  errorSucursales,
  searchSucursal,
  onSearchSucursalChange,
  userSucursalLabel,
}: ComprobantesFiltersProps) {
  const hasValidSucursal = hasValidSucursalId(idSucursal)

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="comprobantes-filter-sucursal">Sucursal</Label>
        {isAdmin ? (
          <>
            <Combobox
              id="comprobantes-filter-sucursal"
              value={hasValidSucursal ? String(idSucursal) : ""}
              options={sucursalOptions}
              searchValue={searchSucursal}
              onSearchValueChange={onSearchSucursalChange}
              onValueChange={(value) => onIdSucursalChange(Number(value))}
              placeholder="Selecciona sucursal"
              searchPlaceholder="Buscar sucursal..."
              emptyMessage="No se encontraron sucursales"
              loading={loadingSucursales}
            />
            {errorSucursales && (
              <p className="text-xs text-red-500">{errorSucursales}</p>
            )}
          </>
        ) : (
          <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3">
            <span className="truncate text-sm font-medium">{userSucursalLabel}</span>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="comprobantes-filter-activo">Estado</Label>
        <Select
          value={activoFilter}
          onValueChange={(value) =>
            onActivoFilterChange(value as "TODOS" | "ACTIVO" | "INACTIVO")
          }
        >
          <SelectTrigger id="comprobantes-filter-activo" className="w-full">
            <SelectValue placeholder="Selecciona estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="ACTIVO">Activos</SelectItem>
            <SelectItem value="INACTIVO">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export const ComprobantesFilters = memo(ComprobantesFiltersComponent)
