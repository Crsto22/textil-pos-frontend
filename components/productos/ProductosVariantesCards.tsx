import Image from "next/image"
import { memo } from "react"
import {
  PencilSquareIcon,
  PhotoIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import type { CatalogVariantItem } from "@/lib/catalog-view"
import { cn } from "@/lib/utils"

interface ProductosVariantesCardsProps {
  variants: CatalogVariantItem[]
  loading: boolean
  onEditVariante: (variant: CatalogVariantItem) => void
  onDeleteVariante: (variant: CatalogVariantItem) => void
}

function normalizeHexColor(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

function isActiveStatus(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase() === "ACTIVO"
}

function ProductosVariantesCardsComponent({
  variants,
  loading,
  onEditVariante,
  onDeleteVariante,
}: ProductosVariantesCardsProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
        Cargando variantes...
      </div>
    )
  }

  if (variants.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
        No se encontraron variantes
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-5">
      {variants.map((variant) => {
        const canManage = variant.variantId !== null
        const variantActive = isActiveStatus(variant.estado)
        const productActive = isActiveStatus(variant.productStatus)
        const globalActive = productActive && variantActive

        return (
          <article
            key={variant.key}
            className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors hover:bg-muted/20"
          >
            <div className="relative h-56 w-full overflow-hidden border-b bg-slate-50 dark:bg-slate-900/40">
              {variant.imageUrl ? (
                <Image
                  src={variant.imageUrl}
                  alt={`${variant.productName} - ${variant.colorName}`}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1700px) 50vw, 33vw"
                  className="object-contain p-4"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <PhotoIcon className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wide">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5",
                    globalActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {globalActive ? "Activo" : "Inactivo"}
                </span>
                <span className="text-muted-foreground">Stock: {variant.stock ?? 0}</span>
              </div>

              <div>
                <p className="mb-1 inline-flex rounded-md bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {variant.categoryName}
                </p>
                <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                  {variant.productName}
                </h3>
                <p className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {formatMonedaPen(variant.regularPrice)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">SKU: {variant.sku || "-"}</p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] text-foreground">
                    <span
                      className="h-3 w-3 rounded-full border border-background"
                      style={{ backgroundColor: normalizeHexColor(variant.colorHex) }}
                    />
                    {variant.colorName}
                  </span>
                  <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {variant.tallaName}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                    title="Editar variante"
                    onClick={() => onEditVariante(variant)}
                    disabled={!canManage}
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    title="Eliminar variante"
                    onClick={() => onDeleteVariante(variant)}
                    disabled={!canManage}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md border px-2 py-0.5 text-[10px] text-muted-foreground">
                  Mayor: {formatMonedaPen(variant.wholesalePrice)}
                </span>
                {typeof variant.offerPrice === "number" && variant.offerPrice > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
                    <TagIcon className="h-3 w-3" />
                    Oferta: {formatMonedaPen(variant.offerPrice)}
                  </span>
                )}
                {!productActive && (
                  <span className="rounded-md border px-2 py-0.5 text-[10px] text-muted-foreground">
                    Producto inactivo
                  </span>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export const ProductosVariantesCards = memo(ProductosVariantesCardsComponent)
