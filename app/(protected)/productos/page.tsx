"use client"

import { useCallback, useState } from "react"

import { ProductosHeader } from "@/components/productos/ProductosHeader"
import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { ProductosSearch } from "@/components/productos/ProductosSearch"
import { ProductosTable } from "@/components/productos/ProductosTable"
import { ProductoCreateDialog } from "@/components/productos/modals/ProductoCreateDialog"
import { ProductoDeleteDialog } from "@/components/productos/modals/ProductoDeleteDialog"
import { ProductoEditDialog } from "@/components/productos/modals/ProductoEditDialog"
import { useProductos } from "@/lib/hooks/useProductos"
import type { Producto } from "@/lib/types/producto"

export default function ProductosPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Producto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null)

  const {
    search,
    setSearch,
    displayedProductos,
    displayedLoading,
    displayedTotalElements,
    displayedTotalPages,
    displayedPage,
    setDisplayedPage,
    createProducto,
    updateProducto,
    deleteProducto,
  } = useProductos()

  const handleOpenCreate = useCallback(() => {
    setShowCreate(true)
  }, [])

  const handleEditProducto = useCallback((producto: Producto) => {
    setEditTarget(producto)
  }, [])

  const handleDeleteProducto = useCallback((producto: Producto) => {
    setDeleteTarget(producto)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-full xl:max-w-md">
          <ProductosSearch search={search} onSearchChange={setSearch} />
        </div>
        <ProductosHeader onOpenCreate={handleOpenCreate} />
      </div>

      <ProductosTable
        productos={displayedProductos}
        loading={displayedLoading}
        onEditProducto={handleEditProducto}
        onDeleteProducto={handleDeleteProducto}
      />

      <ProductosPagination
        totalElements={displayedTotalElements}
        totalPages={displayedTotalPages}
        page={displayedPage}
        onPageChange={setDisplayedPage}
      />

      <ProductoCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createProducto}
      />

      <ProductoEditDialog
        open={editTarget !== null}
        producto={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        onUpdate={updateProducto}
      />

      <ProductoDeleteDialog
        open={deleteTarget !== null}
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onDelete={deleteProducto}
      />
    </div>
  )
}
