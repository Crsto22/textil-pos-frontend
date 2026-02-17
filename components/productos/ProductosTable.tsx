import { memo } from "react"
import {
  CubeIcon,
  PencilSquareIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { ProductosTableSkeleton } from "@/components/productos/ProductosTableSkeleton"
import { formatFechaCreacion } from "@/components/productos/productos.utils"
import type { Producto } from "@/lib/types/producto"

interface ProductosTableProps {
  productos: Producto[]
  loading: boolean
  onEditProducto: (producto: Producto) => void
  onDeleteProducto: (producto: Producto) => void
}

function ProductosTableComponent({
  productos,
  loading,
  onEditProducto,
  onDeleteProducto,
}: ProductosTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Producto
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">
                Categoria
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground xl:table-cell">
                Sucursal
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <ProductosTableSkeleton />
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              productos.map((producto) => (
                <tr
                  key={producto.idProducto}
                  className="border-b transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-semibold text-muted-foreground">
                    {producto.idProducto}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <CubeIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-medium">
                          {producto.nombre}
                        </span>
                        <p className="truncate text-xs text-muted-foreground">
                          SKU: {producto.sku}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Cod. externo: {producto.codigoExterno || "-"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground lg:hidden">
                          {producto.nombreCategoria || "Sin categoria"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground xl:hidden">
                          {producto.nombreSucursal || "Sin sucursal"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFechaCreacion(producto.fechaCreacion)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    <div className="inline-flex items-center gap-1.5">
                      <TagIcon className="h-4 w-4" />
                      <span className="truncate">
                        {producto.nombreCategoria || "Sin categoria"}
                      </span>
                    </div>
                  </td>

                  <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                    {producto.nombreSucursal || "Sin sucursal"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        producto.estado === "ACTIVO"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {producto.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Editar"
                        onClick={() => onEditProducto(producto)}
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                        title="Eliminar"
                        onClick={() => onDeleteProducto(producto)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const ProductosTable = memo(ProductosTableComponent)
