import Image from "next/image"
import { memo } from "react"
import {
  ExclamationTriangleIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusCircleIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"
import { Barcode } from "lucide-react"

import { formatMonedaPen } from "@/components/productos/productos.utils"
import type { CatalogVariantItem } from "@/lib/catalog-view"
import { cn } from "@/lib/utils"

interface ProductosVariantesCardsProps {
  variants: CatalogVariantItem[]
  loading: boolean
  onEditVariante: (variant: CatalogVariantItem) => void
  onDeleteVariante: (variant: CatalogVariantItem) => void
  onShowBarcode: (variant: CatalogVariantItem) => void
  onAddStock?: (variant: CatalogVariantItem) => void
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
  if (stock <= 0) return "bg-rose-50 dark:bg-rose-900/10"
  if (stock <= 5) return "bg-amber-50 dark:bg-amber-900/10"
  return ""
}

interface VarianteCardProps {
  variant: CatalogVariantItem
  onEditVariante: (variant: CatalogVariantItem) => void
  onDeleteVariante: (variant: CatalogVariantItem) => void
  onShowBarcode: (variant: CatalogVariantItem) => void
  onAddStock?: (variant: CatalogVariantItem) => void
}

function VarianteCard({ variant, onEditVariante, onDeleteVariante, onShowBarcode, onAddStock }: VarianteCardProps) {
  const canManage = variant.variantId !== null
  const variantActive = isActiveStatus(variant.estado)
  const productActive = isActiveStatus(variant.productStatus)
  const globalActive = productActive && variantActive
  const hex = normalizeHexColor(variant.colorHex)
  const light = isLightColor(hex)
  const totalStock = variant.stocksSucursalesVenta.reduce((sum, s) => sum + s.stock, 0)
  const noStock = totalStock <= 0 && variant.stocksSucursalesVenta.length > 0
  const noStockRegistered = variant.stocksSucursalesVenta.length === 0

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-colors hover:bg-muted/20",
        noStock || noStockRegistered
          ? "border-rose-300 bg-rose-50/40 dark:border-rose-800/60 dark:bg-rose-950/20"
          : "border bg-card"
      )}
    >
      {/* Imagen con badges */}
      <div className="relative flex h-56 w-full items-center justify-center overflow-hidden border-b bg-slate-50 dark:bg-slate-900/40">
        {variant.imageUrl ? (
          <Image
            key={`${variant.variantId}-${variant.imageUrl}`}
            src={variant.imageUrl}
            alt={`${variant.productName} - ${variant.colorName}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1700px) 50vw, 20vw"
            className={cn("object-contain p-4", (noStock || noStockRegistered) && "opacity-50")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <PhotoIcon className="h-10 w-10" />
          </div>
        )}

        {/* Overlay "Agregar stock" en hover — solo si no hay stock y se pasa callback */}
        {onAddStock && (noStock || noStockRegistered) && (
          <button
            type="button"
            onClick={() => onAddStock(variant)}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100"
          >
            <PlusCircleIcon className="h-7 w-7 text-white drop-shadow" />
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
              Agregar stock
            </span>
          </button>
        )}

        {/* Banda "Sin stock" en la parte inferior de la imagen */}
        {(noStock || noStockRegistered) && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 bg-rose-600/90 py-1.5 backdrop-blur-sm">
            <NoSymbolIcon className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white">
              {noStockRegistered ? "Sin stock registrado" : "Sin stock"}
            </span>
          </div>
        )}

        {/* Badge estado - top left */}
        <span
          className={cn(
            "absolute left-2 top-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            globalActive
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}
        >
          {globalActive ? "Activo" : "Inactivo"}
        </span>

        {/* Badge talla - top right */}
        <span className="absolute right-2 top-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {variant.tallaName}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col space-y-3 p-4">
        {/* Categoria */}
        <p className="inline-flex self-start rounded-md bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {variant.categoryName || "Sin categoria"}
        </p>

        {/* Nombre */}
        <h3 className="line-clamp-2 text-base font-semibold text-foreground">
          {variant.productName}
        </h3>

        {/* SKU */}
        {variant.sku && (
          <p className="text-xs text-muted-foreground">
            SKU: <span className="font-medium text-foreground">{variant.sku}</span>
          </p>
        )}

        {/* Precio */}
        <div className="flex flex-wrap items-baseline gap-2">
          {typeof variant.offerPrice === "number" && variant.offerPrice > 0 ? (
            <>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatMonedaPen(variant.offerPrice)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatMonedaPen(variant.regularPrice)}
              </span>
            </>
          ) : (
            <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatMonedaPen(variant.regularPrice)}
            </span>
          )}
          {typeof variant.wholesalePrice === "number" && variant.wholesalePrice > 0 && (
            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Mayor: {formatMonedaPen(variant.wholesalePrice)}
            </span>
          )}
        </div>

        {/* Color + talla chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "h-5 w-5 rounded-full border",
              light ? "border-gray-300 dark:border-gray-500" : "border-transparent"
            )}
            style={{ backgroundColor: hex }}
            title={variant.colorName}
          />
          <span className="text-xs text-muted-foreground">{variant.colorName}</span>
          <span className="rounded-md border border-blue-500 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {variant.tallaName}
          </span>
          {typeof variant.offerPrice === "number" && variant.offerPrice > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
              <TagIcon className="h-3 w-3" />
              Oferta
            </span>
          )}
        </div>

        {/* Stock por sucursal */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Stock por sucursal
          </p>
          {variant.stocksSucursalesVenta.length > 0 ? (
            <div className="overflow-hidden rounded-lg border text-xs">
              {variant.stocksSucursalesVenta.map((s) => (
                <div
                  key={s.idSucursal}
                  className={cn(
                    "flex items-center justify-between px-2 py-1",
                    getStockRowClass(s.stock)
                  )}
                >
                  <span className="text-muted-foreground">{s.nombreSucursal}</span>
                  <span className={getStockValueClass(s.stock)}>
                    {s.stock <= 0 ? "Sin stock" : `${s.stock} und.`}
                  </span>
                </div>
              ))}
              {variant.stocksSucursalesVenta.length > 1 && (
                <div
                  className={cn(
                    "flex items-center justify-between border-t px-2 py-1",
                    totalStock <= 0
                      ? "bg-rose-50 dark:bg-rose-900/10"
                      : "bg-muted/20"
                  )}
                >
                  <span className="font-semibold text-muted-foreground">Total</span>
                  <span className={cn("font-semibold", getStockValueClass(totalStock))}>
                    {totalStock} und.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-rose-500 dark:text-rose-400">Sin sucursales con stock</p>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Botones de accion */}
        <div className="flex items-center justify-end gap-1 border-t pt-3">
          {variant.codigoBarras && (
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
              title="Ver codigo de barras"
              onClick={() => onShowBarcode(variant)}
            >
              <Barcode className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
            title="Editar variante"
            onClick={() => onEditVariante(variant)}
            disabled={!canManage}
          >
            <PencilSquareIcon className="h-4 w-4" />
            Editar
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            title="Eliminar variante"
            onClick={() => onDeleteVariante(variant)}
            disabled={!canManage}
          >
            <TrashIcon className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>
    </article>
  )
}

function ProductosVariantesCardsComponent({
  variants,
  loading,
  onEditVariante,
  onDeleteVariante,
  onShowBarcode,
  onAddStock,
}: ProductosVariantesCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="h-56 animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
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
      {variants.map((variant) => (
        <VarianteCard
          key={variant.key}
          variant={variant}
          onEditVariante={onEditVariante}
          onDeleteVariante={onDeleteVariante}
          onShowBarcode={onShowBarcode}
          onAddStock={onAddStock}
        />
      ))}
    </div>
  )
}

export const ProductosVariantesCards = memo(ProductosVariantesCardsComponent)
