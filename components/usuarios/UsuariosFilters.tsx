import { memo, useEffect, useMemo } from "react"

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
  getUsuarioRoleOptionsBySucursalType,
  isUsuarioRolAllowedForSucursalType,
  type UsuarioRoleFilter,
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
    getSucursalById,
    getSucursalOptionById,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(true)

  const hasSpecificBranchSelected =
    branchFilter !== "" && branchFilter !== ALL_USUARIO_BRANCH_FILTER
  const selectedBranchType = useMemo(() => {
    if (!hasSpecificBranchSelected) return null

    const selectedBranchId = Number(branchFilter)
    if (!Number.isInteger(selectedBranchId) || selectedBranchId <= 0) return null

    return getSucursalById(selectedBranchId)?.tipo ?? null
  }, [branchFilter, getSucursalById, hasSpecificBranchSelected])

  const availableRoleOptions = useMemo(
    () => getUsuarioRoleOptionsBySucursalType(selectedBranchType),
    [selectedBranchType]
  )

  useEffect(() => {
    if (roleFilter === ALL_USUARIO_ROLE_FILTER) return
    if (isUsuarioRolAllowedForSucursalType(roleFilter, selectedBranchType)) return

    onRoleFilterChange(ALL_USUARIO_ROLE_FILTER)
  }, [onRoleFilterChange, roleFilter, selectedBranchType])

  const branchOptions = useMemo<ComboboxOption[]>(
    () => [
      {
        value: ALL_USUARIO_BRANCH_FILTER,
        label: "Todas las sucursales",
      },
      ...(
        hasSpecificBranchSelected &&
        !sucursalOptions.some((option) => option.value === branchFilter)
          ? [getSucursalOptionById(Number(branchFilter))]
          : []
      ),
      ...sucursalOptions,
    ],
    [branchFilter, getSucursalOptionById, hasSpecificBranchSelected, sucursalOptions]
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
          {availableRoleOptions.map((option) => (
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
