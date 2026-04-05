import { memo, useEffect, useState } from "react"
import { PencilSquareIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline"

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

/* ── Row Component (local state per row) ─────────────────── */

interface ProductoRowProps {
  producto: ProductoResumen
  activeColorId?: number | null
  onEditProducto: (producto: ProductoResumen) => void
  onDeleteProducto: (producto: ProductoResumen) => void
}

function ProductoRow({
  producto,
  activeColorId = null,
  onEditProducto,
  onDeleteProducto,
}: ProductoRowProps) {
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

  function handleColorClick(idx: number) {
    setColorActivoIdx(idx)
    setTallaActivaIdx(0)
    setImgError(false)
  }

  return (
    <tr className="border-b transition-colors last:border-0 hover:bg-muted/20">
      {/* Producto (imagen + nombre) */}
      <td className="px-4 py-3">
        <div className="flex min-w-[220px] items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-slate-50 dark:bg-slate-900/40">
            {imagenSrc && !imgError ? (
              <img
                src={imagenSrc}
                alt={`${producto.nombre} - ${colorActivo?.nombre ?? "Color"}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain p-1.5"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  setImgError(true)
                }}
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
              SKU: {producto.sku || "-"} &middot; {totalSkus} variante{totalSkus !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </td>

      {/* Categoria */}
      <td className="px-4 py-3 text-muted-foreground">
        {producto.nombreCategoria || "Sin categoria"}
      </td>

      {/* Colores + Tallas */}
      <td className="px-4 py-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {producto.colores.map((color, idx) => {
              const hex = normalizeHexColor(color.hex)
              const light = isLightColor(hex)
              return (
                <button
                  type="button"
                  key={color.colorId}
                  onClick={() => handleColorClick(idx)}
                  title={color.nombre}
                  aria-label={`Seleccionar color ${color.nombre}`}
                  className={cn(
                    "h-5 w-5 rounded-full transition-transform",
                    colorActivoIdx === idx
                      ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                      : "opacity-85 hover:scale-110",
                    light ? "border border-gray-300 dark:border-gray-500" : "border border-transparent"
                  )}
                  style={{ backgroundColor: hex }}
                />
              )
            })}
          </div>
          {tallas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tallas.map((talla, idx) => (
                <button
                  type="button"
                  key={talla.tallaId}
                  onClick={() => setTallaActivaIdx(idx)}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
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
        </div>
      </td>

      {/* Precio */}
      <td className="px-4 py-3">
        {tallaActiva ? (
          <div className="space-y-1">
            {precioOferta !== null ? (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatMonedaPen(precioOferta)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatMonedaPen(precioVariante)}
                </span>
              </div>
            ) : (
              <span className="font-medium text-foreground">
                {formatMonedaPen(precioVariante)}
              </span>
            )}
            {precioMayor !== null && (
              <span className="inline-block rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Mayor: {formatMonedaPen(precioMayor)}
              </span>
            )}
          </div>
        ) : (
          <span className="font-medium text-foreground">
            {formatRangoPrecioPen(producto.precioMin, producto.precioMax)}
          </span>
        )}
      </td>

      {/* Stock por sucursal */}
      <td className="px-4 py-3">
        {stocksSucursal.length > 0 ? (
          <div className="min-w-[160px] space-y-0.5 text-xs">
            {stocksSucursal.map((s) => (
              <div key={s.idSucursal} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{s.nombreSucursal}</span>
                <span className="font-medium text-foreground">{s.stock}</span>
              </div>
            ))}
            {stocksSucursal.length > 1 && (
              <div className="flex items-center justify-between gap-3 border-t pt-0.5">
                <span className="font-semibold text-muted-foreground">Total</span>
                <span className="font-semibold text-foreground">{totalStock}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sin stock registrado</span>
        )}
      </td>

      {/* Estado */}
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

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEditProducto(producto)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
            title="Editar producto"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteProducto(producto)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            title="Eliminar producto"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

/* ── Table Component ─────────────────────────────────────── */

interface ProductosTableProps {
  productos: ProductoResumen[]
  loading: boolean
  activeColorId?: number | null
  onEditProducto: (producto: ProductoResumen) => void
  onDeleteProducto: (producto: ProductoResumen) => void
}

function ProductosTableComponent({
  productos,
  loading,
  activeColorId = null,
  onEditProducto,
  onDeleteProducto,
}: ProductosTableProps) {
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
                Colores / Tallas
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Precio
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
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando productos...
                </td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              productos.map((producto) => (
                <ProductoRow
                  key={producto.idProducto}
                  producto={producto}
                  activeColorId={activeColorId}
                  onEditProducto={onEditProducto}
                  onDeleteProducto={onDeleteProducto}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const ProductosTable = memo(ProductosTableComponent)
