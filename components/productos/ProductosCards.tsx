import { memo, useState } from "react"
import Image from "next/image"
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  EllipsisHorizontalIcon,
  PhotoIcon,
  TagIcon,
} from "@heroicons/react/24/outline"

import { ProductosCardsSkeleton } from "@/components/productos/ProductosCardsSkeleton"
import { formatFechaCreacion } from "@/components/productos/productos.utils"
import type { ProductoResumen } from "@/lib/types/producto"
import { cn } from "@/lib/utils"

interface ProductosCardsProps {
  productos: ProductoResumen[]
  loading: boolean
  onDeleteProducto: (producto: ProductoResumen) => void
}

const PEN_CURRENCY_FORMATTER = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function normalizeHexColor(code: string): string {
  const trimmed = code.trim()
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

function formatPrice(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "Sin precio"
  return PEN_CURRENCY_FORMATTER.format(value)
}

function formatPriceRange(
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined
): string {
  const hasMin = typeof minPrice === "number" && !Number.isNaN(minPrice)
  const hasMax = typeof maxPrice === "number" && !Number.isNaN(maxPrice)

  if (hasMin && hasMax) {
    if (Math.abs((minPrice ?? 0) - (maxPrice ?? 0)) < 0.0001) {
      return formatPrice(minPrice)
    }
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
  }
  if (hasMin) return `Desde ${formatPrice(minPrice)}`
  if (hasMax) return `Hasta ${formatPrice(maxPrice)}`
  return "Sin precio"
}

function ProductosCardsComponent({
  productos,
  loading,
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
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {productos.map((producto) => {
        const selectedColorId =
          selectedColorByProduct[producto.idProducto] ?? getDefaultColorId(producto)
        const selectedColor = producto.colores.find(
          (color) => color.colorId === selectedColorId
        )
        const selectedColorTallas = selectedColor?.tallas ?? []
        const imageUrl = selectedColor?.imagenPrincipal?.url || getImageUrl(producto)
        const estadoActivo = producto.estado === "ACTIVO"
        const visibleColors = producto.colores.slice(0, 5)
        const hiddenColors = Math.max(0, producto.colores.length - visibleColors.length)

        return (
          <article
            key={producto.idProducto}
            className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative h-64 w-full overflow-hidden border-b bg-muted/40">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={producto.nombre}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-contain p-2"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <PhotoIcon className="h-10 w-10" />
                </div>
              )}

              <div className="absolute left-3 top-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    estadoActivo
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  )}
                >
                  {estadoActivo ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>

              <div className="absolute right-3 top-3">
                <span className="inline-flex rounded-lg border bg-white/90 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
                  {producto.nombreCategoria || "Sin categoria"}
                </span>
              </div>

            </div>

            <div className="space-y-3 p-4">
              <div className="space-y-2">
                <h3 className="line-clamp-1 text-3xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  {producto.nombre}
                </h3>
                <p className="line-clamp-2 text-lg text-slate-600 dark:text-slate-300">
                  {producto.descripcion?.trim() || "Sin descripcion registrada."}
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {formatPriceRange(producto.precioMin, producto.precioMax)}
                </p>
              </div>

              <div className="h-px w-full bg-border" />

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-1.5 truncate">
                  <TagIcon className="h-3.5 w-3.5 shrink-0" />
                  {producto.sku}
                </p>
                <p className="flex items-center justify-end gap-1.5 truncate">
                  <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" />
                  {formatFechaCreacion(producto.fechaCreacion)}
                </p>
                <p className="col-span-2 flex items-center gap-1.5 truncate">
                  <BuildingStorefrontIcon className="h-3.5 w-3.5 shrink-0" />
                  {producto.nombreSucursal || "Sin sucursal"}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-sm text-slate-600 dark:text-slate-300">
                    {producto.colores.length} Colores:
                  </span>
                  <div className="flex items-center">
                    {visibleColors.map((color, index) => (
                      <button
                        type="button"
                        key={`${producto.idProducto}-${color.colorId}`}
                        onClick={() =>
                          setSelectedColorByProduct((previous) => ({
                            ...previous,
                            [producto.idProducto]: color.colorId,
                          }))
                        }
                        className={cn(
                          "h-7 w-7 rounded-full border-2 border-white transition-transform hover:scale-105 dark:border-slate-900",
                          selectedColorId === color.colorId
                            ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
                            : "opacity-90",
                          index > 0 && "-ml-1"
                        )}
                        style={{ backgroundColor: normalizeHexColor(color.hex) }}
                        title={`${color.nombre} (${normalizeHexColor(color.hex)})`}
                        aria-label={`Mostrar ${color.nombre}`}
                        aria-pressed={selectedColorId === color.colorId}
                      />
                    ))}
                    {hiddenColors > 0 && (
                      <span className="-ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold text-slate-700 dark:border-slate-900 dark:bg-slate-700 dark:text-slate-100">
                        +{hiddenColors}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                  title="Eliminar producto"
                  onClick={() => onDeleteProducto(producto)}
                >
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tallas
                  {selectedColor ? ` (${selectedColor.nombre})` : ""}:
                </p>
                {selectedColorTallas.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Sin tallas registradas para este color.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedColorTallas.map((talla) => (
                      <span
                        key={`${producto.idProducto}-${selectedColorId}-${talla.tallaId}`}
                        className="inline-flex rounded-md border bg-muted/40 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200"
                      >
                        {talla.nombre}
                      </span>
                    ))}
                  </div>
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
