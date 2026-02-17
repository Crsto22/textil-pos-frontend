"use client"

import { useCallback, useState } from "react"

import { CategoriasHeader } from "@/components/categorias/CategoriasHeader"
import { CategoriasPagination } from "@/components/categorias/CategoriasPagination"
import { CategoriasSearch } from "@/components/categorias/CategoriasSearch"
import { CategoriasTable } from "@/components/categorias/CategoriasTable"
import { CategoriaCreateDialog } from "@/components/categorias/modals/CategoriaCreateDialog"
import { CategoriaDeleteDialog } from "@/components/categorias/modals/CategoriaDeleteDialog"
import { CategoriaEditDialog } from "@/components/categorias/modals/CategoriaEditDialog"
import { useCategorias } from "@/lib/hooks/useCategorias"
import type { Categoria } from "@/lib/types/categoria"

export default function CategoriasPage() {
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
  } = useCategorias()

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
        <div className="w-full xl:max-w-md">
          <CategoriasSearch search={search} onSearchChange={setSearch} />
        </div>
        <CategoriasHeader onOpenCreate={handleOpenCreate} />
      </div>

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
