import Image from "next/image"
import { memo } from "react"
import {
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PhotoIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"
import { Barcode } from "lucide-react"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import type { CatalogVariantItem } from "@/lib/catalog-view"
import { cn } from "@/lib/utils"

interface ProductosVariantesTableProps {
  variants: CatalogVariantItem[]
  loading: boolean
  onEditVariante: (variant: CatalogVariantItem) => void
  onDeleteVariante: (variant: CatalogVariantItem) => void
  onShowBarcode?: (variant: CatalogVariantItem) => void
}

function normalizeHexColor(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

function isLightColor(hex: string): boolean {
  const clean = hex.replace("#", "")
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 200
}

function isActiveStatus(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase() === "ACTIVO"
}

function getStockValueClass(stock: number): string {
  if (stock <= 0) return "font-semibold text-rose-600 dark:text-rose-400"
  if (stock <= 5) return "font-semibold text-amber-600 dark:text-amber-400"
  return "font-medium text-emerald-600 dark:text-emerald-400"
}

function getStockRowClass(stock: number): string {
  if (stock <= 0) return "bg-rose-50/60 dark:bg-rose-900/10"
  if (stock <= 5) return "bg-amber-50/60 dark:bg-amber-900/10"
  return ""
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <tr key={i} className="border-b last:border-0">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 animate-pulse rounded-lg bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end gap-2">
              <div className="h-7 w-7 animate-pulse rounded-lg bg-muted" />
              <div className="h-7 w-7 animate-pulse rounded-lg bg-muted" />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

function ProductosVariantesTableComponent({
  variants,
  loading,
  onEditVariante,
  onDeleteVariante,
  onShowBarcode,
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
                Color / Talla
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Precios
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Stock por sucursal
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
              <TableSkeleton />
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
                const hex = normalizeHexColor(variant.colorHex)
                const light = isLightColor(hex)
                const totalStock = variant.stocksSucursalesVenta.reduce((sum, s) => sum + s.stock, 0)

                return (
                  <tr
                    key={variant.key}
                    className="border-b transition-colors last:border-0 hover:bg-muted/20"
                  >
                    {/* Producto (imagen + nombre) */}
                    <td className="px-4 py-3">
                      <div className="flex min-w-[220px] items-center gap-3">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-slate-50 dark:bg-slate-900/40">
                          {variant.imageUrl ? (
                            <Image
                              key={`${variant.variantId}-${variant.imageUrl}`}
                              src={variant.imageUrl}
                              alt={`${variant.productName} - ${variant.colorName}`}
                              fill
                              sizes="56px"
                              className="object-contain p-1.5"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <PhotoIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {variant.productName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {variant.categoryName || "Sin categoria"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            SKU: {variant.sku || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Color + Talla */}
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-5 w-5 shrink-0 rounded-full border",
                              light ? "border-gray-300 dark:border-gray-500" : "border-transparent"
                            )}
                            style={{ backgroundColor: hex }}
                            title={variant.colorName}
                          />
                          <span className="font-medium text-foreground">{variant.colorName}</span>
                        </div>
                        <span className="inline-flex rounded-md border border-blue-500 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {variant.tallaName}
                        </span>
                      </div>
                    </td>

                    {/* Precios */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {typeof variant.offerPrice === "number" && variant.offerPrice > 0 ? (
                          <div className="flex flex-wrap items-baseline gap-1.5">
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {formatMonedaPen(variant.offerPrice)}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatMonedaPen(variant.regularPrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-foreground">
                            {formatMonedaPen(variant.regularPrice)}
                          </span>
                        )}
                        {typeof variant.wholesalePrice === "number" && variant.wholesalePrice > 0 && (
                          <span className="inline-block rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Mayor: {formatMonedaPen(variant.wholesalePrice)}
                          </span>
                        )}
                        {typeof variant.offerPrice === "number" && variant.offerPrice > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
                            <TagIcon className="h-3 w-3" />
                            Oferta
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock por sucursal */}
                    <td className="px-4 py-3">
                      {variant.stocksSucursalesVenta.length > 0 ? (
                        <div className="min-w-[160px] overflow-hidden rounded-lg border text-xs">
                          {variant.stocksSucursalesVenta.map((s) => (
                            <div
                              key={s.idSucursal}
                              className={cn(
                                "flex items-center justify-between gap-3 px-2 py-1",
                                getStockRowClass(s.stock)
                              )}
                            >
                              <span className="text-muted-foreground">{s.nombreSucursal}</span>
                              <span className={getStockValueClass(s.stock)}>
                                {s.stock <= 0 ? "Sin stock" : s.stock}
                              </span>
                            </div>
                          ))}
                          {variant.stocksSucursalesVenta.length > 1 && (
                            <div
                              className={cn(
                                "flex items-center justify-between gap-3 border-t px-2 py-1",
                                totalStock <= 0 ? "bg-rose-50 dark:bg-rose-900/10" : "bg-muted/20"
                              )}
                            >
                              <span className="font-semibold text-muted-foreground">Total</span>
                              <span className={cn("font-semibold", getStockValueClass(totalStock))}>
                                {totalStock}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 dark:border-amber-900/40 dark:bg-amber-900/10">
                          <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span className="text-xs text-amber-700 dark:text-amber-400">Sin stock registrado</span>
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
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

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {variant.codigoBarras && onShowBarcode && (
                          <button
                            type="button"
                            onClick={() => onShowBarcode(variant)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
                            title="Ver codigo de barras"
                          >
                            <Barcode className="h-4 w-4" />
                          </button>
                        )}
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
