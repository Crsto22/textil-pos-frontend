import { memo, useMemo, useState } from "react"
import Image from "next/image"
import {
  ArrowPathIcon,
  CubeIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  PhotoIcon,
  PowerIcon,
} from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import {
  formatFechaCreacion,
  formatMonedaPen,
} from "@/components/productos/productos.utils"
import type {
  ProductoDetalleResponse,
  ProductoDetalleVariante,
  ProductoResumen,
} from "@/lib/types/producto"
import { cn } from "@/lib/utils"

interface ProductoDetallePanelProps {
  productoSeleccionado: ProductoResumen | null
  detalle: ProductoDetalleResponse | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onEditProducto: (idProducto: number) => void
}

function toPositiveNumber(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

function normalizeHexColor(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

function getStockTotal(variantes: ProductoDetalleVariante[]): number {
  return variantes.reduce((total, variante) => total + toPositiveNumber(variante.stock), 0)
}

function getValorInventarioTotal(variantes: ProductoDetalleVariante[]): number {
  return variantes.reduce(
    (total, variante) =>
      total + toPositiveNumber(variante.stock) * toPositiveNumber(variante.precio),
    0
  )
}

function getPrincipalImage(
  detalle: ProductoDetalleResponse | null,
  colorId: number | null
): string | null {
  if (!detalle) return null

  if (colorId !== null) {
    const principalByColor = detalle.imagenes.find(
      (imagen) => imagen.colorId === colorId && imagen.esPrincipal
    )
    const fallbackByColor = detalle.imagenes.find((imagen) => imagen.colorId === colorId)
    const byColor = principalByColor ?? fallbackByColor
    if (byColor) return byColor.urlThumb || byColor.url || null
  }

  const principal = detalle.imagenes.find((imagen) => imagen.esPrincipal)
  const candidate = principal ?? detalle.imagenes[0]
  if (!candidate) return null
  return candidate.urlThumb || candidate.url || null
}

function getCodigoExterno(detalle: ProductoDetalleResponse | null): string {
  const fromProducto = detalle?.producto.codigoExterno?.trim()
  if (fromProducto) return fromProducto

  const fromVariante = detalle?.variantes.find(
    (variante) => typeof variante.codigoExterno === "string" && variante.codigoExterno !== ""
  )?.codigoExterno
  if (fromVariante) return fromVariante

  return "Sin codigo externo"
}

function getUniqueSkuCount(
  detalle: ProductoDetalleResponse | null,
  productoSeleccionado: ProductoResumen | null
): number {
  const skuSet = new Set<string>()

  if (detalle) {
    detalle.variantes.forEach((variante) => {
      const sku = String(variante.sku ?? "").trim()
      if (sku) skuSet.add(sku)
    })
    return skuSet.size
  }

  productoSeleccionado?.colores.forEach((color) => {
    color.tallas.forEach((talla) => {
      const sku = String(talla.sku ?? "").trim()
      if (sku) skuSet.add(sku)
    })
  })

  return skuSet.size
}

interface ProductoColorItem {
  colorId: number
  nombre: string
  hex: string
}

function buildColorItems(
  detalle: ProductoDetalleResponse | null,
  productoSeleccionado: ProductoResumen | null
): ProductoColorItem[] {
  const colorMap = new Map<number, ProductoColorItem>()

  const pushColor = (colorId: number, nombre: string, hex: string | null | undefined) => {
    if (!Number.isFinite(colorId) || colorId <= 0) return

    const normalized: ProductoColorItem = {
      colorId,
      nombre: nombre.trim() || `Color #${colorId}`,
      hex: normalizeHexColor(hex),
    }

    const previous = colorMap.get(colorId)
    if (!previous) {
      colorMap.set(colorId, normalized)
      return
    }

    colorMap.set(colorId, {
      colorId,
      nombre:
        previous.nombre.startsWith("Color #") && !normalized.nombre.startsWith("Color #")
          ? normalized.nombre
          : previous.nombre,
      hex: previous.hex === "#94a3b8" ? normalized.hex : previous.hex,
    })
  }

  detalle?.variantes.forEach((variante) => {
    pushColor(variante.colorId, variante.colorNombre, variante.colorHex)
  })

  detalle?.imagenes.forEach((imagen) => {
    pushColor(imagen.colorId, imagen.colorNombre, imagen.colorHex)
  })

  productoSeleccionado?.colores.forEach((color) => {
    pushColor(color.colorId, color.nombre, color.hex)
  })

  return Array.from(colorMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
}

interface ColorTallaItem {
  tallaId: number
  nombre: string
  sku: string | null
  codigoExterno: string | null
  precio: number | null
  stock: number | null
  estado: string | null
}

function buildTallasPorColor(
  detalle: ProductoDetalleResponse | null,
  productoSeleccionado: ProductoResumen | null,
  selectedColorId: number | null
): ColorTallaItem[] {
  if (selectedColorId === null) return []

  if (detalle) {
    return detalle.variantes
      .filter((variante) => variante.colorId === selectedColorId)
      .sort((a, b) => a.tallaNombre.localeCompare(b.tallaNombre))
      .map((variante) => ({
        tallaId: variante.tallaId,
        nombre: variante.tallaNombre?.trim() || "Sin talla",
        sku: variante.sku ?? null,
        codigoExterno: variante.codigoExterno ?? null,
        precio: typeof variante.precio === "number" ? variante.precio : null,
        stock: typeof variante.stock === "number" ? variante.stock : null,
        estado: variante.estado ?? null,
      }))
  }

  const selectedColor = productoSeleccionado?.colores.find(
    (color) => color.colorId === selectedColorId
  )

  if (!selectedColor) return []
  return selectedColor.tallas.map((talla) => ({
    tallaId: talla.tallaId,
    nombre: talla.nombre,
    sku: talla.sku ?? null,
    codigoExterno: talla.codigoExterno ?? null,
    precio: typeof talla.precio === "number" ? talla.precio : null,
    stock: typeof talla.stock === "number" ? talla.stock : null,
    estado: talla.estado ?? null,
  }))
}

function getEstadoClass(estado: string) {
  return estado === "ACTIVO"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
}

function ProductoDetallePanelComponent({
  productoSeleccionado,
  detalle,
  loading,
  error,
  onRetry,
  onEditProducto,
}: ProductoDetallePanelProps) {
  const producto = detalle?.producto ?? productoSeleccionado
  const estado = (producto?.estado || "INACTIVO").toUpperCase()
  const [selectedColorIdPreference, setSelectedColorIdPreference] = useState<number | null>(
    null
  )

  const stockTotal = useMemo(
    () => (detalle ? getStockTotal(detalle.variantes) : 0),
    [detalle]
  )
  const totalSkuVariantes = useMemo(
    () => getUniqueSkuCount(detalle, productoSeleccionado),
    [detalle, productoSeleccionado]
  )
  const valorInventario = useMemo(
    () => (detalle ? getValorInventarioTotal(detalle.variantes) : 0),
    [detalle]
  )
  const colorItems = useMemo(
    () => buildColorItems(detalle, productoSeleccionado),
    [detalle, productoSeleccionado]
  )
  const selectedColorId = useMemo(() => {
    if (colorItems.length === 0) return null
    if (
      selectedColorIdPreference !== null &&
      colorItems.some((color) => color.colorId === selectedColorIdPreference)
    ) {
      return selectedColorIdPreference
    }
    return colorItems[0].colorId
  }, [colorItems, selectedColorIdPreference])
  const tallasColorSeleccionado = useMemo(
    () => buildTallasPorColor(detalle, productoSeleccionado, selectedColorId),
    [detalle, productoSeleccionado, selectedColorId]
  )

  const selectedColor = useMemo(
    () => colorItems.find((color) => color.colorId === selectedColorId) ?? null,
    [colorItems, selectedColorId]
  )
  const principalImage = getPrincipalImage(detalle, selectedColorId)
  const stockColorSeleccionado = useMemo(
    () =>
      tallasColorSeleccionado.reduce(
        (total, talla) => total + (typeof talla.stock === "number" ? talla.stock : 0),
        0
      ),
    [tallasColorSeleccionado]
  )
  const skuColorSeleccionado = useMemo(() => {
    const set = new Set<string>()
    tallasColorSeleccionado.forEach((talla) => {
      const sku = String(talla.sku ?? "").trim()
      if (sku) set.add(sku)
    })
    return set.size
  }, [tallasColorSeleccionado])

  if (loading && !detalle) {
    return (
      <aside className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />

        <div className="overflow-hidden rounded-xl border bg-muted/40">
          <div className="aspect-[5/4] w-full animate-pulse bg-muted" />
        </div>

        <div className="space-y-2">
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="flex flex-wrap gap-2">
            <div className="h-7 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-16 animate-pulse rounded-md bg-muted" />
          </div>
        </div>

        <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 animate-pulse rounded-md bg-muted" />
          <div className="h-9 animate-pulse rounded-md bg-muted" />
        </div>
      </aside>
    )
  }

  if (!productoSeleccionado && !detalle) {
    return (
      <aside className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        Selecciona un producto para ver su detalle.
      </aside>
    )
  }

  if (error && !detalle) {
    return (
      <aside className="space-y-3 rounded-2xl border border-red-300 bg-card p-5 dark:border-red-900/30">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          No se pudo cargar el detalle
        </p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      </aside>
    )
  }

  if (!producto) {
    return (
      <aside className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        Sin informacion para mostrar.
      </aside>
    )
  }

  return (
    <aside className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Detalle Producto</p>
        {loading && (
          <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-muted/40">
        <div className="relative aspect-[5/4]">
          {principalImage ? (
            <Image
              src={principalImage}
              alt={producto.nombre}
              fill
              unoptimized
              sizes="(max-width: 1280px) 100vw, 500px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <PhotoIcon className="h-8 w-8" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            getEstadoClass(estado)
          )}
        >
          {estado}
        </span>

        <h3 className="text-2xl font-semibold leading-tight text-foreground">{producto.nombre}</h3>
        <p className="text-xs text-muted-foreground">
          SKUs de variantes: {totalSkuVariantes} | Categoria:{" "}
          {producto.nombreCategoria || "Sin categoria"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border bg-muted/40 p-3">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CubeIcon className="h-3.5 w-3.5" />
            Stock Total
          </p>
          <p className="mt-1 text-3xl font-semibold text-red-600 dark:text-red-400">
            {stockTotal}
          </p>
        </div>
        <div className="rounded-xl border bg-muted/40 p-3">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CurrencyDollarIcon className="h-3.5 w-3.5" />
            Valor en almacen
          </p>
          <p className="mt-1 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatMonedaPen(valorInventario)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">Colores del producto</p>
        <div className="flex flex-wrap gap-2">
          {colorItems.length === 0 ? (
            <span className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground">
              Sin colores
            </span>
          ) : (
            colorItems.map((color) => (
              <button
                key={color.colorId}
                type="button"
                onClick={() => setSelectedColorIdPreference(color.colorId)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1 text-[11px] transition-colors",
                  selectedColorId === color.colorId
                    ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300"
                    : "hover:bg-muted"
                )}
              >
                <span
                  className="h-3 w-3 rounded-full border border-background"
                  style={{ backgroundColor: color.hex }}
                  aria-hidden="true"
                />
                <span className="font-medium text-foreground">{color.nombre}</span>
              </button>
            ))
          )}
        </div>

        {selectedColor && (
          <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">
                Color seleccionado: {selectedColor.nombre}
              </p>
              <div className="text-right text-[11px] text-muted-foreground">
                <p>Stock color: {stockColorSeleccionado}</p>
                <p>SKUs color: {skuColorSeleccionado}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tallasColorSeleccionado.length === 0 ? (
                <span className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground">
                  Sin tallas para este color
                </span>
              ) : (
                tallasColorSeleccionado.map((talla) => (
                  <div
                    key={`${selectedColor.colorId}-${talla.tallaId}-${talla.nombre}`}
                    className="min-w-[170px] space-y-1 rounded-md border bg-muted/40 px-2.5 py-2 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{talla.nombre}</span>
                      {typeof talla.stock === "number" && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {talla.stock} u.
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {talla.sku && (
                        <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          SKU: {talla.sku}
                        </span>
                      )}
                      {talla.codigoExterno && (
                        <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          EXT: {talla.codigoExterno}
                        </span>
                      )}
                      {typeof talla.precio === "number" && (
                        <span className="rounded border px-1.5 py-0.5 text-[10px] text-blue-700 dark:text-blue-300">
                          {formatMonedaPen(talla.precio)}
                        </span>
                      )}
                      {talla.estado && (
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            talla.estado === "ACTIVO"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          {talla.estado}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <p className="text-xs font-semibold text-foreground">Detalles Tecnicos</p>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between gap-2 text-foreground">
            <dt className="text-muted-foreground">ID Externo</dt>
            <dd className="text-right">{getCodigoExterno(detalle)}</dd>
          </div>
          <div className="flex justify-between gap-2 text-foreground">
            <dt className="text-muted-foreground">Fecha Creacion</dt>
            <dd className="text-right">{formatFechaCreacion(producto.fechaCreacion)}</dd>
          </div>
          <div className="pt-1 text-foreground">
            <dt className="mb-1 text-muted-foreground">Descripcion</dt>
            <dd className="text-[11px] leading-relaxed text-foreground">
              {producto.descripcion?.trim() || "Sin descripcion registrada."}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          className="bg-blue-600 text-white hover:bg-blue-500"
          onClick={() => onEditProducto(producto.idProducto)}
        >
          <PencilSquareIcon className="h-4 w-4" />
          Editar Producto
        </Button>
        <Button variant="outline">
          <PowerIcon className="h-4 w-4" />
          Cambiar Estado
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-300">
          Ultimo error al refrescar detalle: {error}
        </p>
      )}
    </aside>
  )
}

export const ProductoDetallePanel = memo(ProductoDetallePanelComponent)
