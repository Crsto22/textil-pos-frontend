"use client"

import { useCallback, useState } from "react"

import { TallasHeader } from "@/components/tallas/TallasHeader"
import { TallasPagination } from "@/components/tallas/TallasPagination"
import { TallasSearch } from "@/components/tallas/TallasSearch"
import { TallasTable } from "@/components/tallas/TallasTable"
import { TallaCreateDialog } from "@/components/tallas/modals/TallaCreateDialog"
import { TallaDeleteDialog } from "@/components/tallas/modals/TallaDeleteDialog"
import { TallaEditDialog } from "@/components/tallas/modals/TallaEditDialog"
import { useTallas } from "@/lib/hooks/useTallas"
import type { Talla } from "@/lib/types/talla"

export default function TallasPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Talla | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Talla | null>(null)

  const {
    search,
    setSearch,
    displayedTallas,
    displayedLoading,
    displayedTotalElements,
    displayedTotalPages,
    displayedPage,
    setDisplayedPage,
    createTalla,
    updateTalla,
    deleteTalla,
  } = useTallas()

  const handleOpenCreate = useCallback(() => {
    setShowCreate(true)
  }, [])

  const handleEditTalla = useCallback((talla: Talla) => {
    setEditTarget(talla)
  }, [])

  const handleDeleteTalla = useCallback((talla: Talla) => {
    setDeleteTarget(talla)
  }, [])

  return (
    <div className="space-y-6">
 

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-full xl:max-w-md">
          <TallasSearch search={search} onSearchChange={setSearch} />
        </div>
        <TallasHeader onOpenCreate={handleOpenCreate} />
      </div>

      <TallasTable
        tallas={displayedTallas}
        loading={displayedLoading}
        onEditTalla={handleEditTalla}
        onDeleteTalla={handleDeleteTalla}
      />

      <TallasPagination
        totalElements={displayedTotalElements}
        totalPages={displayedTotalPages}
        page={displayedPage}
        onPageChange={setDisplayedPage}
      />

      <TallaCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createTalla}
      />

      <TallaEditDialog
        open={editTarget !== null}
        talla={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        onUpdate={updateTalla}
      />

      <TallaDeleteDialog
        open={deleteTarget !== null}
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onDelete={deleteTalla}
      />
    </div>
  )
}
