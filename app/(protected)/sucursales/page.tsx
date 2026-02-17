"use client"

import { useCallback, useState } from "react"
import { PlusIcon } from "@heroicons/react/24/outline"

import { SucursalesCards } from "@/components/sucursales/SucursalesCards"
import { SucursalesPagination } from "@/components/sucursales/SucursalesPagination"
import { SucursalesSearch } from "@/components/sucursales/SucursalesSearch"
import { SucursalCreateDialog } from "@/components/sucursales/modals/SucursalCreateDialog"
import { SucursalDeleteDialog } from "@/components/sucursales/modals/SucursalDeleteDialog"
import { SucursalEditDialog } from "@/components/sucursales/modals/SucursalEditDialog"
import { useSucursales } from "@/lib/hooks/useSucursales"
import type {
  Sucursal,
  SucursalCreateRequest,
  SucursalUpdateRequest,
} from "@/lib/types/sucursal"

export default function SucursalesPage() {
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editTarget, setEditTarget] = useState<Sucursal | null>(null)
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Sucursal | null>(null)

  const {
    page,
    error,
    search,
    debouncedSearch,
    setSearch,
    isSearchMode,
    displayedSucursales,
    displayedTotalPages,
    displayedTotalElements,
    displayedPage,
    displayedLoading,
    setDisplayedPage,
    fetchSucursales,
    fetchBuscar,
    createSucursal,
    updateSucursal,
    deleteSucursal,
  } = useSucursales()

  const handleRetry = useCallback(() => {
    if (isSearchMode) {
      void fetchBuscar(debouncedSearch, displayedPage)
      return
    }
    void fetchSucursales(page)
  }, [
    debouncedSearch,
    displayedPage,
    fetchBuscar,
    fetchSucursales,
    isSearchMode,
    page,
  ])

  const handleOpenCreate = useCallback(() => {
    setOpenCreate(true)
  }, [])

  const handleOpenEdit = useCallback((sucursal: Sucursal) => {
    setEditTarget(sucursal)
    setOpenEdit(true)
  }, [])

  const handleOpenDelete = useCallback((sucursal: Sucursal) => {
    setDeleteTarget(sucursal)
    setOpenDelete(true)
  }, [])

  const handleEditOpenChange = useCallback((open: boolean) => {
    setOpenEdit(open)
    if (!open) {
      setEditTarget(null)
    }
  }, [])

  const handleDeleteOpenChange = useCallback((open: boolean) => {
    setOpenDelete(open)
    if (!open) {
      setDeleteTarget(null)
    }
  }, [])

  const handleCreate = useCallback(
    async (payload: SucursalCreateRequest) => createSucursal(payload),
    [createSucursal]
  )

  const handleUpdate = useCallback(
    async (id: number, payload: SucursalUpdateRequest) =>
      updateSucursal(id, payload),
    [updateSucursal]
  )

  const handleDelete = useCallback(
    async (id: number) => {
      const success = await deleteSucursal(id)
      if (success) {
        setDeleteTarget(null)
      }
      return success
    },
    [deleteSucursal]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <SucursalesSearch search={search} onSearchChange={setSearch} />
        </div>
        <div className="shrink-0">
          <button
            onClick={handleOpenCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva Sucursal
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button onClick={handleRetry} className="ml-2 underline hover:no-underline">
            Reintentar
          </button>
        </div>
      )}

      <SucursalesCards
        sucursales={displayedSucursales}
        loading={displayedLoading}
        onEditSucursal={handleOpenEdit}
        onDeleteSucursal={handleOpenDelete}
      />

      <SucursalesPagination
        totalElements={displayedTotalElements}
        totalPages={displayedTotalPages}
        page={displayedPage}
        onPageChange={setDisplayedPage}
      />

      <SucursalCreateDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreate={handleCreate}
      />

      <SucursalEditDialog
        open={openEdit}
        sucursal={editTarget}
        onOpenChange={handleEditOpenChange}
        onUpdate={handleUpdate}
      />

      <SucursalDeleteDialog
        open={openDelete}
        target={deleteTarget}
        onOpenChange={handleDeleteOpenChange}
        onDelete={handleDelete}
      />
    </div>
  )
}
