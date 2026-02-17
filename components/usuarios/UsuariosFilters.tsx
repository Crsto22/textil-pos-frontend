import { memo, useMemo } from "react"

import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import {
  ALL_USUARIO_BRANCH_FILTER,
  ALL_USUARIO_ROLE_FILTER,
  type UsuarioRoleFilter,
  USUARIO_ROLE_OPTIONS,
  isUsuarioRol,
} from "@/lib/types/usuario"

interface UsuariosFiltersProps {
  roleFilter: UsuarioRoleFilter
  branchFilter: string
  onRoleFilterChange: (value: UsuarioRoleFilter) => void
  onBranchFilterChange: (value: string) => void
}

function UsuariosFiltersComponent({
  roleFilter,
  branchFilter,
  onRoleFilterChange,
  onBranchFilterChange,
}: UsuariosFiltersProps) {
  const {
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(true)

  const hasSpecificBranchSelected =
    branchFilter !== "" && branchFilter !== ALL_USUARIO_BRANCH_FILTER

  const branchOptions = useMemo<ComboboxOption[]>(
    () => [
      {
        value: ALL_USUARIO_BRANCH_FILTER,
        label: "Todas las sucursales",
      },
      ...(
        hasSpecificBranchSelected &&
        !sucursalOptions.some((option) => option.value === branchFilter)
          ? [{ value: branchFilter, label: `Sucursal #${branchFilter}` }]
          : []
      ),
      ...sucursalOptions,
    ],
    [branchFilter, hasSpecificBranchSelected, sucursalOptions]
  )

  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
      <Select
        value={roleFilter}
        onValueChange={(value) => {
          if (value === ALL_USUARIO_ROLE_FILTER) {
            onRoleFilterChange(ALL_USUARIO_ROLE_FILTER)
            return
          }

          if (isUsuarioRol(value)) {
            onRoleFilterChange(value)
          }
        }}
      >
        <SelectTrigger className="h-10 w-full sm:min-w-48">
          <SelectValue placeholder="Filtrar por rol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_USUARIO_ROLE_FILTER}>Todos los roles</SelectItem>
          {USUARIO_ROLE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-1">
        <Combobox
          value={branchFilter}
          options={branchOptions}
          searchValue={searchSucursal}
          onSearchValueChange={setSearchSucursal}
          onValueChange={onBranchFilterChange}
          placeholder="Filtrar por sucursal"
          searchPlaceholder="Buscar sucursal..."
          emptyMessage="No se encontraron sucursales"
          loading={loadingSucursales}
        />
        {errorSucursales && (
          <p className="text-xs text-red-500">{errorSucursales}</p>
        )}
      </div>
    </div>
  )
}

export const UsuariosFilters = memo(UsuariosFiltersComponent)
