import { memo, useState, type KeyboardEvent, type MouseEvent } from "react"
import Image from "next/image"
import {
  PencilSquareIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { ProductosCardsSkeleton } from "@/components/productos/ProductosCardsSkeleton"
import { formatRangoPrecioPen } from "@/components/productos/productos.utils"
import type { ProductoResumen } from "@/lib/types/producto"
import { cn } from "@/lib/utils"

interface ProductosCardsProps {
  productos: ProductoResumen[]
  loading: boolean
  selectedProductoId?: number | null
  onSelectProducto?: (producto: ProductoResumen) => void
  onEditProducto: (producto: ProductoResumen) => void
  onDeleteProducto: (producto: ProductoResumen) => void
}

function normalizeHexColor(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

function getImageUrl(producto: ProductoResumen) {
  const colorWithImage = producto.colores.find((color) => color.imagenPrincipal)
  if (!colorWithImage?.imagenPrincipal) return null
  return colorWithImage.imagenPrincipal.url || null
}

function getDefaultColorId(producto: ProductoResumen): number | null {
  const colorWithImage = producto.colores.find((color) => color.imagenPrincipal)
  if (colorWithImage) return colorWithImage.colorId
  return producto.colores[0]?.colorId ?? null
}

function stopCardClick(event: MouseEvent<HTMLButtonElement>) {
  event.stopPropagation()
}

function getVariantSkuStats(producto: ProductoResumen, selectedColorId: number | null) {
  const allSkuSet = new Set<string>()
  const selectedColorSkuSet = new Set<string>()

  producto.colores.forEach((color) => {
    color.tallas.forEach((talla) => {
      const sku = String(talla.sku ?? "").trim()
      if (!sku) return
      allSkuSet.add(sku)
      if (selectedColorId !== null && color.colorId === selectedColorId) {
        selectedColorSkuSet.add(sku)
      }
    })
  })

  return {
    totalSkus: allSkuSet.size,
    selectedColorSkus: selectedColorSkuSet.size,
  }
}

function ProductosCardsComponent({
  productos,
  loading,
  selectedProductoId,
  onSelectProducto,
  onEditProducto,
  onDeleteProducto,
}: ProductosCardsProps) {
  const [selectedColorByProduct, setSelectedColorByProduct] = useState<
    Record<number, number>
  >({})

  if (loading) return <ProductosCardsSkeleton />

  if (productos.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
        No se encontraron productos
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-5">
      {productos.map((producto) => {
        const selectedColorId =
          selectedColorByProduct[producto.idProducto] ?? getDefaultColorId(producto)
        const selectedColor = producto.colores.find(
          (color) => color.colorId === selectedColorId
        )
        const selectedColorTallas = selectedColor?.tallas ?? []
        const imageUrl = selectedColor?.imagenPrincipal?.url || getImageUrl(producto)
        const estadoActivo = producto.estado === "ACTIVO"
        const isSelected = selectedProductoId === producto.idProducto
        const visibleTallas = selectedColorTallas.slice(0, 4)
        const hiddenTallas = Math.max(0, selectedColorTallas.length - visibleTallas.length)
        const skuStats = getVariantSkuStats(producto, selectedColorId)

        const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
          if (event.key !== "Enter" && event.key !== " ") return
          event.preventDefault()
          onSelectProducto?.(producto)
        }

        return (
          <article
            key={producto.idProducto}
            className={cn(
              "group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all",
              isSelected
                ? "border-blue-300 bg-blue-50/70 dark:border-blue-500/40 dark:bg-blue-500/10"
                : "hover:bg-muted/20"
            )}
            onClick={() => onSelectProducto?.(producto)}
            onKeyDown={handleCardKeyDown}
            tabIndex={0}
            role="button"
            aria-pressed={isSelected}
          >
            <div className="relative h-56 w-full overflow-hidden border-b bg-muted/40">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={producto.nombre}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1700px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <PhotoIcon className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5",
                    estadoActivo
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {estadoActivo ? "Activo" : "Inactivo"}
                </span>
                <span className="text-muted-foreground">
                  SKUs: {skuStats.totalSkus || 0}
                </span>
              </div>

              <div>
                <p className="mb-1 inline-flex rounded-md bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {producto.nombreCategoria || "Sin categoria"}
                </p>
                <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                  {producto.nombre}
                </h3>
                <p className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {formatRangoPrecioPen(producto.precioMin, producto.precioMax)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center">
                  {producto.colores.slice(0, 5).map((color, index) => (
                    <button
                      type="button"
                      key={`${producto.idProducto}-${color.colorId}`}
                      onClick={(event) => {
                        stopCardClick(event)
                        setSelectedColorByProduct((previous) => ({
                          ...previous,
                          [producto.idProducto]: color.colorId,
                        }))
                      }}
                      className={cn(
                        "h-5 w-5 rounded-full border border-background transition-transform",
                        selectedColorId === color.colorId
                          ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                          : "opacity-85 hover:scale-105",
                        index > 0 && "-ml-1.5"
                      )}
                      style={{ backgroundColor: normalizeHexColor(color.hex) }}
                      title={color.nombre}
                      aria-label={`Mostrar color ${color.nombre}`}
                      aria-pressed={selectedColorId === color.colorId}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                    title="Editar producto"
                    onClick={(event) => {
                      stopCardClick(event)
                      onEditProducto(producto)
                    }}
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    title="Eliminar producto"
                    onClick={(event) => {
                      stopCardClick(event)
                      onDeleteProducto(producto)
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedColor && (
                  <span className="rounded-md border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {selectedColor.nombre}: {skuStats.selectedColorSkus} SKU
                  </span>
                )}
                {visibleTallas.length === 0 ? (
                  <span className="rounded-md border px-2 py-0.5 text-[10px] text-muted-foreground">
                    Sin tallas
                  </span>
                ) : (
                  <>
                    {visibleTallas.map((talla) => (
                      <span
                        key={`${producto.idProducto}-${selectedColorId}-${talla.tallaId}`}
                        className="rounded-md border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground"
                      >
                        {talla.nombre}
                      </span>
                    ))}
                    {hiddenTallas > 0 && (
                      <span className="rounded-md border px-2 py-0.5 text-[10px] text-muted-foreground">
                        +{hiddenTallas}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export const ProductosCards = memo(ProductosCardsComponent)
