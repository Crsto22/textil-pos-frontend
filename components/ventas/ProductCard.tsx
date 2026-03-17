"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { PhotoIcon } from "@heroicons/react/24/outline"

import { formatMonedaPen, formatRangoPrecioPen } from "@/components/productos/productos.utils"
import { ofertaEstaVigente, obtenerPrecioAplicadoOferta, tienePrecioOfertaValido } from "@/lib/oferta-utils"
import type { ProductoResumen, ProductoResumenTalla } from "@/lib/types/producto"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: ProductoResumen
  onAdd: (product: ProductoResumen) => void
}

function normalizeHexColor(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

function getDefaultColorId(product: ProductoResumen): number | null {
  const withImage = product.colores.find((color) => color.imagenPrincipal)
  if (withImage) return withImage.colorId
  return product.colores[0]?.colorId ?? null
}

function getSkuCount(product: ProductoResumen): number {
  const skuSet = new Set<string>()
  product.colores.forEach((color) => {
    color.tallas.forEach((talla) => {
      const sku = String(talla.sku ?? "").trim()
      if (sku) skuSet.add(sku)
    })
  })
  return skuSet.size
}

function getSingleVariant(product: ProductoResumen): ProductoResumenTalla | null {
  const allVariants = product.colores.flatMap((color) => color.tallas)
  return allVariants.length === 1 ? allVariants[0] ?? null : null
}

function isVariantInStock(talla: ProductoResumenTalla): boolean {
  const estado = String(talla.estado ?? "ACTIVO").trim().toUpperCase()
  if (estado !== "ACTIVO") return false

  if (typeof talla.stock === "number") {
    return talla.stock > 0
  }

  return true
}

function getPrecioAplicado(talla: ProductoResumenTalla): number | null {
  if (typeof talla.precio !== "number") return null
  return obtenerPrecioAplicadoOferta(talla)
}

function getVariantStockBadgeClass(talla: ProductoResumenTalla | null) {
  if (!talla) {
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  }

  const estado = String(talla.estado ?? "ACTIVO").trim().toUpperCase()
  if (estado !== "ACTIVO") {
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  }

  const stock = typeof talla.stock === "number" ? talla.stock : null
  if (stock === null) {
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  }

  if (stock <= 0) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
  }

  if (stock <= 5) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
  }

  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const [selectedColorId, setSelectedColorId] = useState<number | null>(() =>
    getDefaultColorId(product)
  )

  const selectedColor = useMemo(
    () => product.colores.find((color) => color.colorId === selectedColorId) ?? product.colores[0],
    [product.colores, selectedColorId]
  )

  const imageUrl =
    selectedColor?.imagenPrincipal?.url ||
    product.colores.find((color) => color.imagenPrincipal)?.imagenPrincipal?.url ||
    null
  const estadoActivo = product.estado === "ACTIVO"
  const allVariants = product.colores.flatMap((color) => color.tallas)
  const inStockVariants = allVariants.filter((talla) => isVariantInStock(talla)).length
  const outOfStockVariants = Math.max(0, allVariants.length - inStockVariants)
  const allOutOfStock = allVariants.length > 0 && inStockVariants === 0
  const hasPartialStock = inStockVariants > 0 && outOfStockVariants > 0
  const canAdd = estadoActivo && !allOutOfStock

  const visibleTallas = (selectedColor?.tallas ?? []).slice(0, 4)
  const hiddenTallas = Math.max(0, (selectedColor?.tallas?.length ?? 0) - visibleTallas.length)
  const skuCount = getSkuCount(product)
  const singleVariant = getSingleVariant(product)
  const showSingleVariantStock = singleVariant !== null
  const singleVariantStock =
    typeof singleVariant?.stock === "number" ? singleVariant.stock : null

  const selectedColorTallas = selectedColor?.tallas ?? []
  const selectedColorDiscountedRegularPrices = selectedColorTallas
    .filter((talla) => tienePrecioOfertaValido(talla) && ofertaEstaVigente(talla))
    .map((talla) => talla.precio as number)
  const selectedColorAppliedPrices = selectedColorTallas
    .map((talla) => getPrecioAplicado(talla))
    .filter((price): price is number => typeof price === "number")

  const selectedColorRegularMin =
    selectedColorDiscountedRegularPrices.length > 0
      ? Math.min(...selectedColorDiscountedRegularPrices)
      : null
  const selectedColorAppliedMin =
    selectedColorAppliedPrices.length > 0 ? Math.min(...selectedColorAppliedPrices) : null
  const showSelectedColorDiscount =
    selectedColorRegularMin !== null &&
    selectedColorAppliedMin !== null &&
    selectedColorAppliedMin < selectedColorRegularMin

  return (
    <article
      onClick={() => {
        if (canAdd) onAdd(product)
      }}
      className={cn(
        "group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all",
        canAdd ? "cursor-pointer hover:bg-muted/20" : "cursor-not-allowed opacity-85"
      )}
    >
      <div className="relative h-52 w-full overflow-hidden border-b bg-slate-50 dark:bg-slate-900/40">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.nombre}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1700px) 33vw, 25vw"
            className="object-contain p-4"
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
              !estadoActivo
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : allOutOfStock
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                  : hasPartialStock
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            )}
          >
            {!estadoActivo
              ? "Inactivo"
              : allOutOfStock
                ? "Agotado"
                : hasPartialStock
                  ? "Stock parcial"
                  : "Activo"}
          </span>
          {showSingleVariantStock ? (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5",
                getVariantStockBadgeClass(singleVariant)
              )}
            >
              Stock: {singleVariantStock ?? "-"}
            </span>
          ) : (
            <span className="text-muted-foreground">SKUs: {skuCount}</span>
          )}
        </div>

        <div>
          <p className="mb-1 inline-flex rounded-md bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {product.nombreCategoria || "Sin categoria"}
          </p>
          <h3 className="line-clamp-2 text-base font-semibold text-foreground">{product.nombre}</h3>
          {showSelectedColorDiscount ? (
            <>
              <p className="mt-1 text-xs font-semibold text-muted-foreground line-through">
                {formatMonedaPen(selectedColorRegularMin)}
              </p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {formatMonedaPen(selectedColorAppliedMin)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatRangoPrecioPen(product.precioMin, product.precioMax)}
            </p>
          )}
          {estadoActivo && hasPartialStock && (
            <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {outOfStockVariants} variante{outOfStockVariants === 1 ? "" : "s"} sin stock
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {product.colores.slice(0, 6).map((color, index) => (
            <button
              type="button"
              key={`${product.idProducto}-${color.colorId}`}
              onClick={(event) => {
                event.stopPropagation()
                setSelectedColorId(color.colorId)
              }}
              className={cn(
                "h-5 w-5 rounded-full border border-background transition-transform",
                selectedColorId === color.colorId
                  ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                  : "opacity-85 hover:scale-105",
                index > 0 && "-ml-1"
              )}
              style={{ backgroundColor: normalizeHexColor(color.hex) }}
              aria-label={`Filtrar por color ${color.nombre}`}
              title={color.nombre}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {selectedColor && (
            <span className="rounded-md border px-2 py-0.5 text-[10px] text-muted-foreground">
              {selectedColor.nombre}
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
                  key={`${product.idProducto}-${selectedColorId}-${talla.tallaId}`}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                    isVariantInStock(talla)
                      ? "bg-muted/50 text-foreground"
                      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300"
                  )}
                >
                  {talla.nombre}
                  {!isVariantInStock(talla) && " - Agotado"}
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
}
