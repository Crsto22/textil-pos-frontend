import Image from "next/image"
import { memo } from "react"
import {
  PencilSquareIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import type { CatalogVariantItem } from "@/lib/catalog-view"
import { cn } from "@/lib/utils"

interface ProductosVariantesTableProps {
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

function ProductosVariantesTableComponent({
  variants,
  loading,
  onEditVariante,
  onDeleteVariante,
}: ProductosVariantesTableProps) {
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
                Variante
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Precios
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Stock
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
                  Cargando variantes...
                </td>
              </tr>
            ) : variants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No se encontraron variantes
                </td>
              </tr>
            ) : (
              variants.map((variant) => {
                const canManage = variant.variantId !== null
                const variantActive = isActiveStatus(variant.estado)
                const productActive = isActiveStatus(variant.productStatus)
                const globalActive = productActive && variantActive

                return (
                  <tr
                    key={variant.key}
                    className="border-b transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-[260px] items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-slate-50 dark:bg-slate-900/40">
                          {variant.imageUrl ? (
                            <Image
                              src={variant.imageUrl}
                              alt={`${variant.productName} - ${variant.colorName}`}
                              fill
                              unoptimized
                              sizes="56px"
                              className="object-contain p-1.5"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <PhotoIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-semibold text-foreground">
                            {variant.productName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            Categoria: {variant.categoryName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            SKU: {variant.sku || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full border border-background"
                            style={{ backgroundColor: normalizeHexColor(variant.colorHex) }}
                            title={variant.colorName}
                          />
                          <span className="font-medium text-foreground">{variant.colorName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Talla: {variant.tallaName}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1 text-xs">
                        <p className="font-medium text-foreground">
                          Normal: {formatMonedaPen(variant.regularPrice)}
                        </p>
                        <p className="text-muted-foreground">
                          Mayor: {formatMonedaPen(variant.wholesalePrice)}
                        </p>
                        <p className="text-muted-foreground">
                          Oferta: {formatMonedaPen(variant.offerPrice)}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium text-foreground">
                      {typeof variant.stock === "number" ? variant.stock : "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            globalActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          {globalActive ? "Activo" : "Inactivo"}
                        </span>
                        {!productActive && (
                          <span className="text-[11px] text-muted-foreground">
                            Producto inactivo
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditVariante(variant)}
                          disabled={!canManage}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                          title="Editar variante"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteVariante(variant)}
                          disabled={!canManage}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          title="Eliminar variante"
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

export const ProductosVariantesTable = memo(ProductosVariantesTableComponent)
