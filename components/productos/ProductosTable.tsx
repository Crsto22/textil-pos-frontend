import Image from "next/image"
import { memo, useState, type MouseEvent } from "react"
import { PencilSquareIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline"

import { formatRangoPrecioPen } from "@/components/productos/productos.utils"
import type { ProductoResumen } from "@/lib/types/producto"
import { cn } from "@/lib/utils"

interface ProductosTableProps {
  productos: ProductoResumen[]
  loading: boolean
  selectedProductoId?: number | null
  onSelectProducto?: (producto: ProductoResumen) => void
  onEditProducto: (producto: ProductoResumen) => void
  onDeleteProducto: (producto: ProductoResumen) => void
}

function stopRowAction(event: MouseEvent<HTMLButtonElement>) {
  event.stopPropagation()
}

function getSkuCount(producto: ProductoResumen): number {
  const skuSet = new Set<string>()
  producto.colores.forEach((color) => {
    color.tallas.forEach((talla) => {
      const sku = String(talla.sku ?? "").trim()
      if (sku) skuSet.add(sku)
    })
  })
  return skuSet.size
}

function getColorCount(producto: ProductoResumen): number {
  return producto.colores.length
}

function getDefaultColorId(producto: ProductoResumen): number | null {
  const colorWithImage = producto.colores.find((color) => color.imagenPrincipal)
  if (colorWithImage) return colorWithImage.colorId
  return producto.colores[0]?.colorId ?? null
}

function normalizeHexColor(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

function ProductosTableComponent({
  productos,
  loading,
  selectedProductoId,
  onSelectProducto,
  onEditProducto,
  onDeleteProducto,
}: ProductosTableProps) {
  const [selectedColorByProduct, setSelectedColorByProduct] = useState<
    Record<number, number>
  >({})

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Precio
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Variantes
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
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando productos...
                </td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              productos.map((producto) => {
                const isSelected = selectedProductoId === producto.idProducto
                const skuCount = getSkuCount(producto)
                const colorCount = getColorCount(producto)
                const estadoActivo = producto.estado === "ACTIVO"
                const selectedColorId =
                  selectedColorByProduct[producto.idProducto] ?? getDefaultColorId(producto)
                const selectedColor = producto.colores.find(
                  (color) => color.colorId === selectedColorId
                )
                const selectedColorImageUrl = selectedColor?.imagenPrincipal?.url ?? null

                return (
                  <tr
                    key={producto.idProducto}
                    onClick={() => onSelectProducto?.(producto)}
                    className={cn(
                      "cursor-pointer border-b transition-colors last:border-0",
                      isSelected
                        ? "bg-blue-50/70 dark:bg-blue-500/10"
                        : "hover:bg-muted/20"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-[250px] items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted/40">
                          {selectedColorImageUrl ? (
                            <Image
                              src={selectedColorImageUrl}
                              alt={`${producto.nombre} - ${selectedColor?.nombre ?? "Color"}`}
                              fill
                              unoptimized
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <PhotoIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{producto.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            SKU base: {producto.sku || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Color seleccionado: {selectedColor?.nombre ?? "Sin color"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {producto.nombreCategoria || "Sin categoria"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatRangoPrecioPen(producto.precioMin, producto.precioMax)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {producto.colores.map((color) => (
                            <button
                              type="button"
                              key={`${producto.idProducto}-${color.colorId}`}
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedColorByProduct((previous) => ({
                                  ...previous,
                                  [producto.idProducto]: color.colorId,
                                }))
                              }}
                              title={color.nombre}
                              aria-label={`Seleccionar color ${color.nombre}`}
                              className={cn(
                                "h-5 w-5 rounded-full border border-background transition-transform",
                                selectedColorId === color.colorId
                                  ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                                  : "opacity-85 hover:scale-105"
                              )}
                              style={{ backgroundColor: normalizeHexColor(color.hex) }}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {colorCount} color(es), {skuCount} SKU(s)
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          estadoActivo
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {estadoActivo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            stopRowAction(event)
                            onEditProducto(producto)
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                          title="Editar producto"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            stopRowAction(event)
                            onDeleteProducto(producto)
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          title="Eliminar producto"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const ProductosTable = memo(ProductosTableComponent)
