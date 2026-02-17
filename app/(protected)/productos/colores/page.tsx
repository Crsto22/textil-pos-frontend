"use client"

import { useCallback, useState } from "react"

import { ColoresHeader } from "@/components/colores/ColoresHeader"
import { ColoresPagination } from "@/components/colores/ColoresPagination"
import { ColoresSearch } from "@/components/colores/ColoresSearch"
import { ColoresTable } from "@/components/colores/ColoresTable"
import { ColorCreateDialog } from "@/components/colores/modals/ColorCreateDialog"
import { ColorDeleteDialog } from "@/components/colores/modals/ColorDeleteDialog"
import { ColorEditDialog } from "@/components/colores/modals/ColorEditDialog"
import { useColores } from "@/lib/hooks/useColores"
import type { Color } from "@/lib/types/color"

export default function ColoresPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Color | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Color | null>(null)

  const {
    search,
    setSearch,
    displayedColores,
    displayedLoading,
    displayedTotalElements,
    displayedTotalPages,
    displayedPage,
    setDisplayedPage,
    createColor,
    updateColor,
    deleteColor,
  } = useColores()

  const handleOpenCreate = useCallback(() => {
    setShowCreate(true)
  }, [])

  const handleEditColor = useCallback((color: Color) => {
    setEditTarget(color)
  }, [])

  const handleDeleteColor = useCallback((color: Color) => {
    setDeleteTarget(color)
  }, [])

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-full xl:max-w-md">
          <ColoresSearch search={search} onSearchChange={setSearch} />
        </div>
        <ColoresHeader onOpenCreate={handleOpenCreate} />
      </div>

      <ColoresTable
        colores={displayedColores}
        loading={displayedLoading}
        onEditColor={handleEditColor}
        onDeleteColor={handleDeleteColor}
      />

      <ColoresPagination
        totalElements={displayedTotalElements}
        totalPages={displayedTotalPages}
        page={displayedPage}
        onPageChange={setDisplayedPage}
      />

      <ColorCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createColor}
      />

      <ColorEditDialog
        open={editTarget !== null}
        color={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        onUpdate={updateColor}
      />

      <ColorDeleteDialog
        open={deleteTarget !== null}
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onDelete={deleteColor}
      />
    </div>
  )
}
