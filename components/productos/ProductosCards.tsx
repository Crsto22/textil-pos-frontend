import { memo, useEffect, useState } from "react"
import {
  ExclamationTriangleIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { ProductosCardsSkeleton } from "@/components/productos/ProductosCardsSkeleton"
import { formatMonedaPen, formatRangoPrecioPen } from "@/components/productos/productos.utils"
import type { ProductoResumen, ProductoResumenColor } from "@/lib/types/producto"
import { cn } from "@/lib/utils"

/* ── Helpers ─────────────────────────────────────────────── */

const TALLA_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"]

function tallaSortIndex(nombre: string): number {
  const idx = TALLA_ORDER.indexOf(nombre.toUpperCase())
  return idx === -1 ? 999 : idx
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
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 200
}

function getTotalSkus(producto: ProductoResumen): number {
  return producto.colores.flatMap((c) => c.tallas).length
}

function getInitialColorIndex(
  producto: ProductoResumen,
  activeColorId?: number | null
): number {
  if (typeof activeColorId === "number" && activeColorId > 0) {
    const idx = producto.colores.findIndex((color) => color.colorId === activeColorId)
    if (idx >= 0) return idx
  }

  const colorWithImageIdx = producto.colores.findIndex(
    (color) => Boolean(color.imagenPrincipal?.urlThumb || color.imagenPrincipal?.url)
  )
  if (colorWithImageIdx >= 0) return colorWithImageIdx

  return 0
}

/* ── Single Card Component (local state) ─────────────────── */

interface ProductoCardProps {
  producto: ProductoResumen
  activeColorId?: number | null
  onEditProducto: (producto: ProductoResumen) => void
  onDeleteProducto: (producto: ProductoResumen) => void
}

function ProductoCard({
  producto,
  activeColorId = null,
  onEditProducto,
  onDeleteProducto,
}: ProductoCardProps) {
  const [colorActivoIdx, setColorActivoIdx] = useState(() =>
    getInitialColorIndex(producto, activeColorId)
  )
  const [tallaActivaIdx, setTallaActivaIdx] = useState(0)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const nextColorIdx = getInitialColorIndex(producto, activeColorId)
    setColorActivoIdx(nextColorIdx)
    setTallaActivaIdx(0)
    setImgError(false)
  }, [activeColorId, producto.colores, producto.idProducto])

  const colorActivo: ProductoResumenColor | undefined = producto.colores[colorActivoIdx]
  const fallbackColor = producto.colores.find((color) =>
    Boolean(color.imagenPrincipal?.urlThumb || color.imagenPrincipal?.url)
  )
  const tallas = [...(colorActivo?.tallas ?? [])].sort(
    (a, b) => tallaSortIndex(a.nombre) - tallaSortIndex(b.nombre)
  )
  const tallaActiva = tallas[tallaActivaIdx] ?? null

  const imagenSrc =
    colorActivo?.imagenPrincipal?.urlThumb ??
    colorActivo?.imagenPrincipal?.url ??
    fallbackColor?.imagenPrincipal?.urlThumb ??
    fallbackColor?.imagenPrincipal?.url ??
    null
  const estadoActivo = producto.estado === "ACTIVO"
  const totalSkus = getTotalSkus(producto)

  const precioVariante = tallaActiva?.precio ?? null
  const precioMayor = tallaActiva?.precioMayor ?? null
  const precioOferta = tallaActiva?.precioOferta ?? null

  const stocksSucursal = tallaActiva?.stocksSucursalesVenta ?? []
  const totalStock = stocksSucursal.reduce((sum, s) => sum + s.stock, 0)

  const allTallas = producto.colores.flatMap((c) => c.tallas)
  const varianteStocks = allTallas.map((t) =>
    (t.stocksSucursalesVenta ?? []).reduce((sum, s) => sum + s.stock, 0)
  )
  const hasAnyStock = varianteStocks.some((s) => s > 0)
  const hasAnyNoStock = varianteStocks.some((s) => s <= 0)
  const noStock = allTallas.length > 0 && !hasAnyStock
  const noStockRegistered = allTallas.length > 0 && allTallas.every((t) => (t.stocksSucursalesVenta ?? []).length === 0)
  const hasPartialStock = hasAnyStock && hasAnyNoStock

  function handleColorClick(idx: number) {
    setColorActivoIdx(idx)
    setTallaActivaIdx(0)
    setImgError(false)
  }

  return (
    <article className={cn(
      "flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-colors hover:bg-muted/20",
      noStock || noStockRegistered
        ? "border-rose-300 bg-rose-50/40 dark:border-rose-800/60 dark:bg-rose-950/20"
        : "bg-card"
    )}>
      {/* ── Imagen con badges ─────────────────────── */}
      <div className="relative flex h-40 w-full items-center justify-center overflow-hidden border-b bg-slate-50 sm:h-56 dark:bg-slate-900/40">
        {imagenSrc && !imgError ? (
          <img
            src={imagenSrc}
            alt={`${producto.nombre} - ${colorActivo?.nombre ?? "Color"}`}
            loading="lazy"
            decoding="async"
            className={cn("h-full w-full object-contain p-4", (noStock || noStockRegistered) && "opacity-50")}
            onError={(e) => {
              e.currentTarget.style.display = "none"
              setImgError(true)
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <PhotoIcon className="h-10 w-10" />
          </div>
        )}

        {/* Badge estado - top left */}
        <span
          className={cn(
            "absolute left-2 top-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            estadoActivo
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
          )}
        >
          {estadoActivo ? "Activo" : "Inactivo"}
        </span>

        {/* Banda inferior — estado de stock */}
        {(noStock || noStockRegistered) && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 bg-rose-600/90 py-1.5 backdrop-blur-sm">
            <NoSymbolIcon className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white">
              {noStockRegistered ? "No disponible en esta sucursal" : "Sin stock"}
            </span>
          </div>
        )}
        {/* Badge SKUs - top right */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {totalSkus} SKU{totalSkus !== 1 ? "s" : ""}
          </span>
          {hasPartialStock && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <ExclamationTriangleIcon className="h-3 w-3" />
              Stock parcial
            </span>
          )}
        </div>
      </div>

      {/* ── Cuerpo ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col space-y-2 p-3 sm:space-y-3 sm:p-4">
        {/* Categoria */}
        <p className="inline-flex self-start rounded-md bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {producto.nombreCategoria || "Sin categoria"}
        </p>

        {/* Nombre */}
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
          {producto.nombre}
        </h3>

        {/* Precio */}
        <div>
          {tallaActiva ? (
            <div className="flex flex-wrap items-baseline gap-1.5">
              {precioOferta !== null ? (
                <>
                  <span className="text-sm font-semibold text-red-600 sm:text-lg dark:text-red-400">
                    {formatMonedaPen(precioOferta)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through sm:text-sm">
                    {formatMonedaPen(precioVariante)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-blue-600 sm:text-lg dark:text-blue-400">
                  {formatMonedaPen(precioVariante)}
                </span>
              )}
              {precioMayor !== null && (
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Mayor: {formatMonedaPen(precioMayor)}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm font-semibold text-blue-600 sm:text-lg dark:text-blue-400">
              {formatRangoPrecioPen(producto.precioMin, producto.precioMax)}
            </p>
          )}
        </div>

        {/* Selector de colores */}
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {producto.colores.map((color, idx) => {
            const hex = normalizeHexColor(color.hex)
            const light = isLightColor(hex)
            return (
              <button
                type="button"
                key={color.colorId}
                onClick={() => handleColorClick(idx)}
                className={cn(
                  "h-5 w-5 rounded-full transition-transform",
                  colorActivoIdx === idx
                    ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                    : "opacity-85 hover:scale-110",
                  light ? "border border-gray-300 dark:border-gray-500" : "border border-transparent"
                )}
                style={{ backgroundColor: hex }}
                title={color.nombre}
                aria-label={`Mostrar color ${color.nombre}`}
                aria-pressed={colorActivoIdx === idx}
              />
            )
          })}
        </div>

        {/* Selector de tallas (chips) */}
        {tallas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tallas.map((talla, idx) => (
              <button
                type="button"
                key={talla.tallaId}
                onClick={() => setTallaActivaIdx(idx)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  tallaActivaIdx === idx
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-muted bg-muted/30 text-muted-foreground hover:bg-muted/60"
                )}
              >
                {talla.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Stock por sucursal */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Stock
          </p>
          {stocksSucursal.length > 0 ? (
            <div className="overflow-hidden rounded-lg border text-[11px] sm:text-xs">
              {stocksSucursal.map((s) => (
                <div
                  key={s.idSucursal}
                  className={cn(
                    "flex items-center justify-between px-2 py-0.5",
                    s.stock <= 0 ? "bg-rose-50 dark:bg-rose-900/10" : ""
                  )}
                >
                  <span className="truncate text-muted-foreground">{s.nombreSucursal}</span>
                  <span className={cn(
                    "ml-1 shrink-0 font-medium",
                    s.stock <= 0
                      ? "text-rose-600 dark:text-rose-400"
                      : s.stock <= 5
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {s.stock} und.
                  </span>
                </div>
              ))}
              {stocksSucursal.length > 1 && (
                <div className={cn(
                  "flex items-center justify-between border-t px-2 py-0.5",
                  totalStock <= 0 ? "bg-rose-50 dark:bg-rose-900/10" : "bg-muted/20"
                )}>
                  <span className="font-semibold text-muted-foreground">Total</span>
                  <span className={cn(
                    "font-semibold",
                    totalStock <= 0
                      ? "text-rose-600 dark:text-rose-400"
                      : totalStock <= 5
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {totalStock} und.
                  </span>
                </div>
              )}
            </div>
          ) : tallaActiva !== null ? (
            <p className="text-[11px] text-rose-500 dark:text-rose-400">No disponible en esta sucursal</p>
          ) : (
            <span className="text-[11px] text-muted-foreground">Selecciona una talla</span>
          )}
        </div>

        {/* Spacer para empujar botones al fondo */}
        <div className="flex-1" />

        {/* Botones de accion */}
        <div className="flex items-center justify-end gap-1 border-t pt-2 sm:pt-3">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 sm:w-auto sm:gap-1.5 sm:px-3 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
            title="Editar producto"
            onClick={() => onEditProducto(producto)}
          >
            <PencilSquareIcon className="h-4 w-4" />
            <span className="hidden text-xs font-medium sm:inline">Editar</span>
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 sm:w-auto sm:gap-1.5 sm:px-3 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            title="Eliminar producto"
            onClick={() => onDeleteProducto(producto)}
          >
            <TrashIcon className="h-4 w-4" />
            <span className="hidden text-xs font-medium sm:inline">Eliminar</span>
          </button>
        </div>
      </div>
    </article>
  )
}

/* ── Grid Component ──────────────────────────────────────── */

interface ProductosCardsProps {
  productos: ProductoResumen[]
  loading: boolean
  activeColorId?: number | null
  onEditProducto: (producto: ProductoResumen) => void
  onDeleteProducto: (producto: ProductoResumen) => void
}

function ProductosCardsComponent({
  productos,
  loading,
  activeColorId = null,
  onEditProducto,
  onDeleteProducto,
}: ProductosCardsProps) {
  if (loading) return <ProductosCardsSkeleton />

  if (productos.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
        No se encontraron productos
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {productos.map((producto) => (
        <ProductoCard
          key={producto.idProducto}
          producto={producto}
          activeColorId={activeColorId}
          onEditProducto={onEditProducto}
          onDeleteProducto={onDeleteProducto}
        />
      ))}
    </div>
  )
}

export const ProductosCards = memo(ProductosCardsComponent)
