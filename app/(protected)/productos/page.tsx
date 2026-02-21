"use client"

import { useCallback, useState } from "react"

import { ProductosCards } from "@/components/productos/ProductosCards"
import { ProductosHeader } from "@/components/productos/ProductosHeader"
import { ProductosPagination } from "@/components/productos/ProductosPagination"
import { ProductoDeleteDialog } from "@/components/productos/modals/ProductoDeleteDialog"
import { useProductos } from "@/lib/hooks/useProductos"
import type { ProductoResumen } from "@/lib/types/producto"

export default function ProductosPage() {
  const [deleteTarget, setDeleteTarget] = useState<ProductoResumen | null>(null)

  const {
    displayedProductos,
    displayedLoading,
    displayedTotalElements,
    displayedTotalPages,
    displayedPage,
    setDisplayedPage,
    deleteProducto,
  } = useProductos()

  const handleDeleteProducto = useCallback((producto: ProductoResumen) => {
    setDeleteTarget(producto)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ProductosHeader />
      </div>

      <ProductosCards
        productos={displayedProductos}
        loading={displayedLoading}
        onDeleteProducto={handleDeleteProducto}
      />

      <ProductosPagination
        totalElements={displayedTotalElements}
        totalPages={displayedTotalPages}
        page={displayedPage}
        onPageChange={setDisplayedPage}
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
