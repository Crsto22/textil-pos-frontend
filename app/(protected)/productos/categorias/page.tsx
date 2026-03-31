"use client"

import { useCallback, useEffect, useMemo, startTransition, useState } from "react"
import { BuildingStorefrontIcon } from "@heroicons/react/24/outline"

import { CategoriasHeader } from "@/components/categorias/CategoriasHeader"
import { CategoriasPagination } from "@/components/categorias/CategoriasPagination"
import { CategoriasSearch } from "@/components/categorias/CategoriasSearch"
import { CategoriasTable } from "@/components/categorias/CategoriasTable"
import { CategoriaCreateDialog } from "@/components/categorias/modals/CategoriaCreateDialog"
import { CategoriaDeleteDialog } from "@/components/categorias/modals/CategoriaDeleteDialog"
import { CategoriaEditDialog } from "@/components/categorias/modals/CategoriaEditDialog"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { useAuth } from "@/lib/auth/auth-context"
import { useCategorias } from "@/lib/hooks/useCategorias"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useSucursalGlobal } from "@/lib/sucursal-global-context"
import { getSucursalAvatarColor, getSucursalInitials } from "@/lib/sucursal"
import type { Categoria } from "@/lib/types/categoria"

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

export default function CategoriasPage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)

  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const defaultAdminSucursalId =
    isAdmin && hasValidSucursalId(user?.idSucursal) ? user.idSucursal : null
  const effectiveSelectedSucursalId = hasValidSucursalId(selectedSucursalId)
    ? selectedSucursalId
    : defaultAdminSucursalId
  const hasSelectedSucursal = hasValidSucursalId(effectiveSelectedSucursalId)
  const resolvedSucursalId = isAdmin
    ? hasSelectedSucursal
      ? effectiveSelectedSucursalId
      : null
    : userHasSucursal
      ? user?.idSucursal ?? null
      : null

  const {
    sucursalOptions,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin)

  const { sucursalGlobal } = useSucursalGlobal()
  useEffect(() => {
    if (!isAdmin || sucursalGlobal === null) return
    startTransition(() => setSelectedSucursalId(sucursalGlobal.idSucursal))
  }, [sucursalGlobal, isAdmin])

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      hasSelectedSucursal &&
      !sucursalOptions.some((o) => o.value === String(effectiveSelectedSucursalId))
        ? [
            {
              value: String(effectiveSelectedSucursalId),
              label: `Sucursal #${effectiveSelectedSucursalId}`,
              avatarText: getSucursalInitials("Sucursal"),
              avatarClassName: getSucursalAvatarColor(effectiveSelectedSucursalId),
            },
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [effectiveSelectedSucursalId, hasSelectedSucursal, sucursalOptions]
  )

  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Categoria | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)

  const {
    search,
    setSearch,
    displayedCategorias,
    displayedLoading,
    displayedTotalElements,
    displayedTotalPages,
    displayedPage,
    setDisplayedPage,
    createCategoria,
    updateCategoria,
    deleteCategoria,
  } = useCategorias(resolvedSucursalId)

  const handleOpenCreate = useCallback(() => {
    setShowCreate(true)
  }, [])

  const handleEditCategoria = useCallback((categoria: Categoria) => {
    setEditTarget(categoria)
  }, [])

  const handleDeleteCategoria = useCallback((categoria: Categoria) => {
    setDeleteTarget(categoria)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isAdmin && (
            <div className="w-full sm:w-64">
              <Combobox
                options={sucursalComboboxOptions}
                value={
                  hasValidSucursalId(effectiveSelectedSucursalId)
                    ? String(effectiveSelectedSucursalId)
                    : ""
                }
                onValueChange={(val) => {
                  const id = Number(val)
                  setSelectedSucursalId(Number.isFinite(id) && id > 0 ? id : null)
                }}
                placeholder="Seleccionar sucursal"
                searchValue={searchSucursal}
                onSearchValueChange={setSearchSucursal}
                searchPlaceholder="Buscar sucursal..."
                emptyMessage="Sin sucursales"
              />
            </div>
          )}
          <div className="w-full xl:max-w-md">
            <CategoriasSearch search={search} onSearchChange={setSearch} />
          </div>
        </div>
        <CategoriasHeader onOpenCreate={handleOpenCreate} />
      </div>

      {resolvedSucursalId === null ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
            <BuildingStorefrontIcon className="h-7 w-7 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Selecciona una sucursal
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Elige una sucursal para ver y gestionar sus categorías
          </p>
        </div>
      ) : (
        <>
          <CategoriasTable
            categorias={displayedCategorias}
            loading={displayedLoading}
            onEditCategoria={handleEditCategoria}
            onDeleteCategoria={handleDeleteCategoria}
          />

          <CategoriasPagination
            totalElements={displayedTotalElements}
            totalPages={displayedTotalPages}
            page={displayedPage}
            onPageChange={setDisplayedPage}
          />
        </>
      )}

      <CategoriaCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createCategoria}
      />

      <CategoriaEditDialog
        open={editTarget !== null}
        categoria={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        onUpdate={updateCategoria}
      />

      <CategoriaDeleteDialog
        open={deleteTarget !== null}
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onDelete={deleteCategoria}
      />
    </div>
  )
}
