"use client"

import { useMemo, useState } from "react"
import {
  MagnifyingGlassIcon,
  PhotoIcon,
  QueueListIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

// ─── Helpers de color (igual que ProductosCards) ─────────────────────────────

function normalizeHexColor(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8" // slate-400 fallback
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

// ─── Tipos exportados (usados también en ProductosCargaMasivaPage) ────────────

export type VariantePreview = {
  colorNombre: string
  tallaNombre: string
  sku: string
  codigoBarras: string
  precio: string
  precioMayor: string
  stock: string
  /** Hex del color obtenido de la BD durante la validación */
  colorHex?: string
}

export type ProductoPreview = {
  codigoModelo: string
  nombreProducto: string
  categoriaNombre: string
  descripcion: string
  variantes: VariantePreview[]
}

type VarianteFlatItem = VariantePreview & {
  codigoModelo: string
  nombreProducto: string
  categoriaNombre: string
}

type DisplayMode = "cards" | "tabla"

// ─── PreviewProductoCard — igual diseño que ProductoCard ─────────────────────

function PreviewProductoCard({ producto }: { producto: ProductoPreview }) {
  // Colores únicos con su hex (del primer variante que tenga ese nombre)
  const uniqueColores = useMemo(() => {
    const seen = new Map<string, string | undefined>()
    for (const v of producto.variantes) {
      if (v.colorNombre && !seen.has(v.colorNombre)) {
        seen.set(v.colorNombre, v.colorHex)
      }
    }
    return Array.from(seen.entries()).map(([nombre, hex]) => ({ nombre, hex }))
  }, [producto.variantes])

  const [colorActivoIdx, setColorActivoIdx] = useState(0)
  const [tallaActivaIdx, setTallaActivaIdx] = useState(0)

  const colorActivo = uniqueColores[colorActivoIdx]?.nombre ?? null

  const tallasForColor = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const v of producto.variantes) {
      if (
        v.tallaNombre &&
        (!colorActivo || v.colorNombre === colorActivo) &&
        !seen.has(v.tallaNombre)
      ) {
        seen.add(v.tallaNombre)
        result.push(v.tallaNombre)
      }
    }
    return result
  }, [producto.variantes, colorActivo])

  const activeVariant = useMemo(() => {
    const tallaActiva = tallasForColor[tallaActivaIdx] ?? null
    const found = producto.variantes.find(
      (v) =>
        (!colorActivo || v.colorNombre === colorActivo) &&
        (!tallaActiva || v.tallaNombre === tallaActiva)
    )
    return found ?? producto.variantes[0] ?? null
  }, [producto.variantes, colorActivo, tallasForColor, tallaActivaIdx])

  const { precioMin, precioMax } = useMemo(() => {
    const prices = producto.variantes
      .map((v) => parseFloat(v.precio))
      .filter((n) => !isNaN(n))
    if (!prices.length) return { precioMin: null, precioMax: null }
    return { precioMin: Math.min(...prices), precioMax: Math.max(...prices) }
  }, [producto.variantes])

  const totalSkus = producto.variantes.length
  const activePrecio = activeVariant?.precio ? parseFloat(activeVariant.precio) : null
  const activePrecioMayor =
    activeVariant?.precioMayor ? parseFloat(activeVariant.precioMayor) : null
  const activeStock = activeVariant?.stock || null

  function handleColorClick(idx: number) {
    setColorActivoIdx(idx)
    setTallaActivaIdx(0)
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors hover:bg-muted/20">
      {/* ── Área de imagen ────────────────────────── */}
      <div className="relative flex h-56 w-full items-center justify-center overflow-hidden border-b bg-slate-50 dark:bg-slate-900/40">
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <PhotoIcon className="h-10 w-10" />
        </div>

        {/* Badge SKUs — top right */}
        <span className="absolute right-2 top-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {totalSkus} SKU{totalSkus !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Cuerpo ────────────────────────────────── */}
      <div className="flex flex-1 flex-col space-y-3 p-4">
        {/* Categoría */}
        <p className="inline-flex self-start rounded-md bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {producto.categoriaNombre || "Sin categoría"}
        </p>

        {/* Nombre */}
        <h3 className="line-clamp-2 text-base font-semibold text-foreground">
          {producto.nombreProducto || "Sin nombre"}
        </h3>

        {/* Precio */}
        <div>
          {activeVariant && activePrecio !== null ? (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                S/ {activePrecio.toFixed(2)}
              </span>
              {activePrecioMayor !== null && (
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Mayor: S/ {activePrecioMayor.toFixed(2)}
                </span>
              )}
            </div>
          ) : precioMin !== null ? (
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {precioMin === precioMax
                ? `S/ ${precioMin.toFixed(2)}`
                : `S/ ${precioMin.toFixed(2)} – S/ ${precioMax!.toFixed(2)}`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin precio</p>
          )}
        </div>

        {/* Selector de colores */}
        {uniqueColores.length > 0 && (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {uniqueColores.map((color, idx) => {
              const hex = normalizeHexColor(color.hex)
              const light = isLightColor(hex)
              return (
                <button
                  type="button"
                  key={color.nombre}
                  onClick={() => handleColorClick(idx)}
                  style={{ backgroundColor: hex }}
                  className={cn(
                    "h-5 w-5 rounded-full transition-transform",
                    light
                      ? "border border-gray-300 dark:border-gray-500"
                      : "border border-transparent",
                    colorActivoIdx === idx
                      ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-background"
                      : "opacity-85 hover:scale-110"
                  )}
                  title={color.nombre}
                  aria-label={`Color ${color.nombre}`}
                  aria-pressed={colorActivoIdx === idx}
                />
              )
            })}
          </div>
        )}

        {/* Selector de tallas */}
        {tallasForColor.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tallasForColor.map((talla, idx) => (
              <button
                type="button"
                key={talla}
                onClick={() => setTallaActivaIdx(idx)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  tallaActivaIdx === idx
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-muted bg-muted/30 text-muted-foreground hover:bg-muted/60"
                )}
              >
                {talla}
              </button>
            ))}
          </div>
        )}

        {/* Stock */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Stock
          </p>
          {activeStock ? (
            <div className="rounded-lg border bg-muted/10 p-2 text-xs">
              <div className="flex items-center justify-between py-0.5">
                <span className="text-muted-foreground">Disponible</span>
                <span className="font-medium text-foreground">{activeStock} und.</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Sin stock registrado</span>
          )}
        </div>

        <div className="flex-1" />
      </div>
    </article>
  )
}

// ─── Subcomponentes de display ────────────────────────────────────────────────

function ModelosCards({ productos }: { productos: ProductoPreview[] }) {
  if (productos.length === 0) return <EmptyState />
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-5">
      {productos.map((producto) => (
        <PreviewProductoCard key={producto.codigoModelo} producto={producto} />
      ))}
    </div>
  )
}

function ModelosTabla({ productos }: { productos: ProductoPreview[] }) {
  if (productos.length === 0) return <EmptyState />
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-max text-sm">
        <thead className="border-b bg-muted/50">
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Categoría</th>
            <th className="px-4 py-3 font-semibold">Descripción</th>
            <th className="px-4 py-3 text-center font-semibold">Variantes</th>
            <th className="px-4 py-3 font-semibold">Colores</th>
            <th className="px-4 py-3 font-semibold">Tallas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {productos.map((p) => {
            const coloresConHex = p.variantes.reduce<
              Array<{ nombre: string; hex?: string }>
            >((acc, v) => {
              if (v.colorNombre && !acc.some((c) => c.nombre === v.colorNombre)) {
                acc.push({ nombre: v.colorNombre, hex: v.colorHex })
              }
              return acc
            }, [])
            const tallas = [...new Set(p.variantes.map((v) => v.tallaNombre).filter(Boolean))]
            return (
              <tr key={p.codigoModelo} className="hover:bg-muted/40">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                  {p.nombreProducto || (
                    <span className="italic text-muted-foreground">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {p.categoriaNombre || "—"}
                </td>
                <td className="max-w-[200px] px-4 py-3 text-muted-foreground">
                  <p className="truncate">{p.descripcion || "—"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center">
                  <span className="rounded-full bg-blue-600/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                    {p.variantes.length}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {coloresConHex.map((c) => {
                      if (c.hex) {
                        const hex = normalizeHexColor(c.hex)
                        const light = isLightColor(hex)
                        return (
                          <span
                            key={c.nombre}
                            title={c.nombre}
                            className={cn(
                              "inline-block h-5 w-5 shrink-0 rounded-full",
                              light
                                ? "border border-gray-300 dark:border-gray-500"
                                : "border border-transparent"
                            )}
                            style={{ backgroundColor: hex }}
                          />
                        )
                      }
                      return (
                        <span
                          key={c.nombre}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
                        >
                          {c.nombre}
                        </span>
                      )
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {tallas.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function VariantesCards({
  variantes,
  autoSku,
  autoBarcode,
  onVarianteChange,
}: {
  variantes: VarianteFlatItem[]
  autoSku?: boolean
  autoBarcode?: boolean
  onVarianteChange?: (codigoModelo: string, colorNombre: string, tallaNombre: string, field: "sku" | "codigoBarras", value: string) => void
}) {
  if (variantes.length === 0) return <EmptyState />
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {variantes.map((v, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            {v.categoriaNombre && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {v.categoriaNombre}
              </span>
            )}
          </div>
          <p className="mb-1 truncate text-sm font-semibold text-foreground">
            {v.nombreProducto || (
              <span className="italic text-muted-foreground">Sin nombre</span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {v.colorNombre && (
              <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                {v.colorNombre}
              </span>
            )}
            {v.tallaNombre && (
              <span className="rounded-md bg-muted px-2 py-0.5">{v.tallaNombre}</span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t pt-2 text-xs">
            <div className="col-span-2">
              <p className="mb-1 text-muted-foreground">SKU</p>
              {autoSku ? (
                v.sku ? (
                  <p className="font-mono font-medium text-foreground">{v.sku}</p>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">AUTO</span>
                )
              ) : (
                <input
                  type="text"
                  value={v.sku}
                  onChange={(e) => onVarianteChange?.(v.codigoModelo, v.colorNombre, v.tallaNombre, "sku", e.target.value)}
                  placeholder="Ingresa SKU"
                  className="h-7 w-full rounded-md border border-input bg-background px-2 font-mono text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              )}
            </div>
            <div className="col-span-2">
              <p className="mb-1 text-muted-foreground">Cód. Barras</p>
              {autoBarcode ? (
                v.codigoBarras ? (
                  <p className="font-mono font-medium text-foreground">{v.codigoBarras}</p>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">AUTO</span>
                )
              ) : (
                <input
                  type="text"
                  value={v.codigoBarras}
                  onChange={(e) => onVarianteChange?.(v.codigoModelo, v.colorNombre, v.tallaNombre, "codigoBarras", e.target.value)}
                  placeholder="Cód. Barras"
                  className="h-7 w-full rounded-md border border-input bg-background px-2 font-mono text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Stock</p>
              <p className="font-semibold text-foreground">{v.stock || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Precio</p>
              <p className="font-medium text-foreground">
                {v.precio ? `S/ ${v.precio}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Precio Mayor</p>
              <p className="text-foreground">
                {v.precioMayor ? `S/ ${v.precioMayor}` : "—"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function VariantesTabla({
  variantes,
  autoSku,
  autoBarcode,
  onVarianteChange,
}: {
  variantes: VarianteFlatItem[]
  autoSku?: boolean
  autoBarcode?: boolean
  onVarianteChange?: (codigoModelo: string, colorNombre: string, tallaNombre: string, field: "sku" | "codigoBarras", value: string) => void
}) {
  if (variantes.length === 0) return <EmptyState />
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-max text-sm">
        <thead className="border-b bg-muted/50">
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Color</th>
            <th className="px-4 py-3 font-semibold">Talla</th>
            <th className="px-4 py-3 font-semibold">SKU</th>
            <th className="px-4 py-3 font-semibold">Cód. Barras</th>
            <th className="px-4 py-3 text-right font-semibold">Precio</th>
            <th className="px-4 py-3 text-right font-semibold">P. Mayor</th>
            <th className="px-4 py-3 text-right font-semibold">Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {variantes.map((v, i) => (
            <tr key={i} className="hover:bg-muted/40">
              <td className="whitespace-nowrap px-4 py-3 text-foreground">
                {v.nombreProducto || (
                  <span className="italic text-muted-foreground">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {v.colorNombre ? (
                  <div className="flex items-center gap-1.5">
                    {v.colorHex ? (
                      <span
                        className={cn(
                          "inline-block h-4 w-4 shrink-0 rounded-full",
                          isLightColor(normalizeHexColor(v.colorHex))
                            ? "border border-gray-300 dark:border-gray-500"
                            : "border border-transparent"
                        )}
                        style={{ backgroundColor: normalizeHexColor(v.colorHex) }}
                      />
                    ) : null}
                    <span className="text-muted-foreground">{v.colorNombre}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {v.tallaNombre || "—"}
              </td>
              <td className="whitespace-nowrap px-2 py-2">
                {autoSku ? (
                  v.sku ? (
                    <span className="font-mono text-xs text-muted-foreground">{v.sku}</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">AUTO</span>
                  )
                ) : (
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => onVarianteChange?.(v.codigoModelo, v.colorNombre, v.tallaNombre, "sku", e.target.value)}
                    placeholder="SKU"
                    className="h-7 w-28 rounded-md border border-input bg-background px-2 font-mono text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-2">
                {autoBarcode ? (
                  v.codigoBarras ? (
                    <span className="font-mono text-xs text-muted-foreground">{v.codigoBarras}</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">AUTO</span>
                  )
                ) : (
                  <input
                    type="text"
                    value={v.codigoBarras}
                    onChange={(e) => onVarianteChange?.(v.codigoModelo, v.colorNombre, v.tallaNombre, "codigoBarras", e.target.value)}
                    placeholder="Cód. Barras"
                    className="h-7 w-32 rounded-md border border-input bg-background px-2 font-mono text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">
                {v.precio ? `S/ ${v.precio}` : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                {v.precioMayor ? `S/ ${v.precioMayor}` : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                {v.stock || <span className="italic text-muted-foreground/60">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-300/50 bg-amber-50/50 py-10 dark:bg-amber-900/10">
      <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
        Ningún resultado con los filtros aplicados
      </p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface PreviewCargaMasivaViewProps {
  productos: ProductoPreview[]
  autoSku?: boolean
  autoBarcode?: boolean
  onVarianteChange?: (codigoModelo: string, colorNombre: string, tallaNombre: string, field: "sku" | "codigoBarras", value: string) => void
}

export function PreviewCargaMasivaView({ productos, autoSku, autoBarcode, onVarianteChange }: PreviewCargaMasivaViewProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("tabla")
  const [search, setSearch] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState<string | null>(null)
  const [colorFilter, setColorFilter] = useState<string | null>(null)

  const uniqueCategorias = useMemo(() => {
    const names = productos.map((p) => p.categoriaNombre).filter(Boolean)
    return [...new Set(names)].sort((a, b) => a.localeCompare(b))
  }, [productos])

  const uniqueColores = useMemo(() => {
    const seen = new Map<string, string | undefined>()
    for (const p of productos) {
      for (const v of p.variantes) {
        if (v.colorNombre && !seen.has(v.colorNombre)) {
          seen.set(v.colorNombre, v.colorHex)
        }
      }
    }
    return Array.from(seen.entries())
      .map(([nombre, hex]) => ({ nombre, hex }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [productos])

  const filteredProductos = useMemo(() => {
    const searchLower = search.trim().toLowerCase()
    return productos.filter((p) => {
      const matchesSearch =
        !searchLower ||
        p.codigoModelo.toLowerCase().includes(searchLower) ||
        p.nombreProducto.toLowerCase().includes(searchLower) ||
        p.categoriaNombre.toLowerCase().includes(searchLower) ||
        p.variantes.some(
          (v) =>
            v.sku.toLowerCase().includes(searchLower) ||
            v.colorNombre.toLowerCase().includes(searchLower) ||
            v.tallaNombre.toLowerCase().includes(searchLower)
        )
      const matchesCategoria = !categoriaFilter || p.categoriaNombre === categoriaFilter
      const matchesColor =
        !colorFilter || p.variantes.some((v) => v.colorNombre === colorFilter)
      return matchesSearch && matchesCategoria && matchesColor
    })
  }, [productos, search, categoriaFilter, colorFilter])

  const flatVariantes = useMemo((): VarianteFlatItem[] => {
    return filteredProductos.flatMap((p) =>
      p.variantes
        .filter((v) => !colorFilter || v.colorNombre === colorFilter)
        .map((v) => ({
          ...v,
          codigoModelo: p.codigoModelo,
          nombreProducto: p.nombreProducto,
          categoriaNombre: p.categoriaNombre,
        }))
    )
  }, [filteredProductos, colorFilter])

  const totalVariantes = flatVariantes.length

  return (
    <div className="space-y-4">
      {/* ── Barra de búsqueda + toggles ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código, SKU, color, talla..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        {/* Cards / Tabla toggle */}
        <div className="inline-flex h-[42px] shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <button
            type="button"
            onClick={() => setDisplayMode("tabla")}
            title="Vista tabla"
            className={[
              "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
              displayMode === "tabla"
                ? "bg-white shadow text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500",
            ].join(" ")}
          >
            <QueueListIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode("cards")}
            title="Vista tarjetas"
            className={[
              "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
              displayMode === "cards"
                ? "bg-white shadow text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500",
            ].join(" ")}
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Filtros de categoría y color ── */}
      {(uniqueCategorias.length > 0 || uniqueColores.length > 0) && (
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60">
          <div className="flex flex-wrap items-center gap-3">
            {uniqueCategorias.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Categoría:
                </span>
                <button
                  type="button"
                  onClick={() => setCategoriaFilter(null)}
                  className={[
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                    categoriaFilter === null
                      ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                  ].join(" ")}
                >
                  Todas
                </button>
                {uniqueCategorias.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaFilter(categoriaFilter === cat ? null : cat)}
                    className={[
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                      categoriaFilter === cat
                        ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {uniqueCategorias.length > 0 && uniqueColores.length > 0 && (
              <div className="h-6 w-px bg-border" />
            )}

            {uniqueColores.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Color:
                </span>
                <button
                  type="button"
                  onClick={() => setColorFilter(null)}
                  className={[
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                    colorFilter === null
                      ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                  ].join(" ")}
                >
                  Todos
                </button>
                {uniqueColores.map((color) => {
                  const isActive = colorFilter === color.nombre
                  if (color.hex) {
                    const hex = normalizeHexColor(color.hex)
                    return (
                      <button
                        type="button"
                        key={color.nombre}
                        onClick={() => setColorFilter(isActive ? null : color.nombre)}
                        title={color.nombre}
                        className={cn(
                          "h-6 w-6 shrink-0 rounded-full border-2 transition-all duration-150",
                          isActive
                            ? "border-blue-500 scale-110 shadow-md"
                            : "border-white hover:scale-110 dark:border-slate-800"
                        )}
                        style={{ backgroundColor: hex }}
                      />
                    )
                  }
                  return (
                    <button
                      type="button"
                      key={color.nombre}
                      onClick={() => setColorFilter(isActive ? null : color.nombre)}
                      className={[
                        "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                        isActive
                          ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                      ].join(" ")}
                    >
                      {color.nombre}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Contador de resultados ── */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Mostrando <strong>{totalVariantes}</strong> variante(s) de{" "}
        <strong>{productos.reduce((a, p) => a + p.variantes.length, 0)}</strong> en el archivo
      </p>

      {/* ── Vista principal — siempre variantes ── */}
      {displayMode === "cards" ? (
        <VariantesCards
          variantes={flatVariantes}
          autoSku={autoSku}
          autoBarcode={autoBarcode}
          onVarianteChange={onVarianteChange}
        />
      ) : (
        <VariantesTabla
          variantes={flatVariantes}
          autoSku={autoSku}
          autoBarcode={autoBarcode}
          onVarianteChange={onVarianteChange}
        />
      )}
    </div>
  )
}
