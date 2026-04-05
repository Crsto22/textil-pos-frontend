"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  ArrowDownTrayIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  CubeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { Sucursal } from "@/lib/types/sucursal"

interface VarianteSearchItem {
  idProductoVariante: number
  sku: string | null
  codigoBarras: string | null
  stock: number | null
  precio: number | null
  producto: { idProducto: number; nombre: string; descripcion: string } | null
  color: { idColor: number; nombre: string; hex: string | null } | null
  talla: { idTalla: number; nombre: string } | null
  imagenPrincipal: { url: string; urlThumb: string } | null
}

export interface AgregarStockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-select a specific sucursal */
  defaultIdSucursal?: number | null
  /** Pre-fill search with barcode */
  defaultCodigoBarras?: string | null
  /** Pre-fill search query */
  defaultQuery?: string | null
  /** Called after successful stock entry */
  onSuccess?: () => void
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function SucursalMiniCard({
  sucursal,
  selected,
  onSelect,
}: {
  sucursal: Sucursal
  selected: boolean
  onSelect: () => void
}) {
  const isAlmacen = sucursal.tipo === "ALMACEN"
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex w-full items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-500 dark:bg-blue-900/15"
          : "border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/30"
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          selected ? "bg-blue-100 dark:bg-blue-900/40" : "bg-muted"
        }`}
      >
        <BuildingStorefrontIcon
          className={`h-3.5 w-3.5 ${selected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs font-semibold ${selected ? "text-blue-700 dark:text-blue-300" : "text-foreground"}`}>
          {sucursal.nombre}
        </p>
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
            isAlmacen
              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          }`}
        >
          {isAlmacen ? "Almacen" : "Venta"}
        </span>
      </div>
      {selected && (
        <CheckCircleIcon className="h-4 w-4 shrink-0 text-blue-500" />
      )}
    </button>
  )
}

export function AgregarStockModal({
  open,
  onOpenChange,
  defaultIdSucursal = null,
  defaultCodigoBarras = null,
  defaultQuery = null,
  onSuccess,
}: AgregarStockModalProps) {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userSucursalId =
    typeof user?.idSucursal === "number" && user.idSucursal > 0
      ? user.idSucursal
      : null

  const { sucursales, loadingSucursales } = useSucursalOptions(open)

  // --- State (initialized from props — component is remounted via key each time) ---
  const initialSucursalId = defaultIdSucursal ?? (!isAdmin ? userSucursalId : null)
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(initialSucursalId)
  const [varianteQuery, setVarianteQuery] = useState(defaultCodigoBarras || defaultQuery || "")
  const [varianteResults, setVarianteResults] = useState<VarianteSearchItem[]>([])
  const [loadingVariantes, setLoadingVariantes] = useState(false)
  const [selectedVariante, setSelectedVariante] = useState<VarianteSearchItem | null>(null)
  const [cantidad, setCantidad] = useState("")
  const [motivo, setMotivo] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const searchAbortRef = useRef<AbortController | null>(null)
  const selectedVarianteRef = useRef<VarianteSearchItem | null>(null)
  selectedVarianteRef.current = selectedVariante

  // --- Auto-search barcode on mount ---
  useEffect(() => {
    if (!defaultCodigoBarras) return

    const controller = new AbortController()
    setLoadingVariantes(true)

    const run = async () => {
      try {
        const params = new URLSearchParams({ q: defaultCodigoBarras, page: "0" })
        if (initialSucursalId) params.set("idSucursal", String(initialSucursalId))
        const response = await authFetch(`/api/variante/listar-resumen?${params.toString()}`, {
          signal: controller.signal,
        })
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (response.ok && data?.content) {
          const results = (data.content as VarianteSearchItem[]).slice(0, 10)
          if (results.length === 1) {
            setSelectedVariante(results[0])
            setVarianteQuery("")
            setVarianteResults([])
          } else {
            setVarianteResults(results)
          }
        }
      } catch {
        // silent
      } finally {
        if (!controller.signal.aborted) setLoadingVariantes(false)
      }
    }

    void run()
    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Debounced search ---
  const searchVariantes = useCallback(async (query: string, idSucursal?: number | null) => {
    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller
    setLoadingVariantes(true)

    try {
      const params = new URLSearchParams({ q: query.trim(), page: "0" })
      if (idSucursal) params.set("idSucursal", String(idSucursal))
      const response = await authFetch(`/api/variante/listar-resumen?${params.toString()}`, {
        signal: controller.signal,
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (response.ok && data?.content) {
        setVarianteResults((data.content as VarianteSearchItem[]).slice(0, 10))
      } else {
        setVarianteResults([])
      }
    } catch {
      if (!controller.signal.aborted) setVarianteResults([])
    } finally {
      if (!controller.signal.aborted) setLoadingVariantes(false)
    }
  }, [])

  useEffect(() => {
    if (selectedVariante) return

    const timer = setTimeout(() => {
      if (varianteQuery.trim().length >= 2) {
        searchVariantes(varianteQuery, selectedSucursalId)
      } else {
        setVarianteResults([])
        setLoadingVariantes(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [varianteQuery, selectedSucursalId, searchVariantes, selectedVariante])

  // --- Re-fetch stock on sucursal change ---
  useEffect(() => {
    const current = selectedVarianteRef.current
    if (!current) return

    const query = current.sku ?? current.codigoBarras ?? current.producto?.nombre ?? ""
    if (!query) return

    const controller = new AbortController()

    const run = async () => {
      try {
        const params = new URLSearchParams({ q: query, page: "0" })
        if (selectedSucursalId) params.set("idSucursal", String(selectedSucursalId))
        const response = await authFetch(`/api/variante/listar-resumen?${params.toString()}`, {
          signal: controller.signal,
        })
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (response.ok && data?.content) {
          const results = data.content as VarianteSearchItem[]
          const updated = results.find((r) => r.idProductoVariante === current.idProductoVariante)
          if (updated) setSelectedVariante(updated)
        }
      } catch {
        // silent
      }
    }

    void run()
    return () => controller.abort()
  }, [selectedSucursalId, open])

  // Cleanup on unmount
  useEffect(() => () => searchAbortRef.current?.abort(), [])

  // --- Validation ---
  const cantidadNum = parseInt(cantidad, 10)
  const stockActual = selectedVariante?.stock ?? 0
  const cantidadValida = Number.isFinite(cantidadNum) && cantidadNum > 0 ? cantidadNum : 0
  const stockFinal = stockActual + cantidadValida

  const isValid =
    selectedSucursalId !== null &&
    selectedVariante !== null &&
    Number.isFinite(cantidadNum) &&
    cantidadNum > 0

  // --- Submit ---
  const handleSubmit = useCallback(async () => {
    if (!isValid || !selectedVariante) return

    setIsSaving(true)
    try {
      const response = await authFetch("/api/sucursal-stock/movimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idSucursal: selectedSucursalId,
          idProductoVariante: selectedVariante.idProductoVariante,
          tipoMovimiento: "ENTRADA",
          cantidad: cantidadNum,
          motivo: motivo.trim() || undefined,
        }),
      })

      const data = await parseJsonSafe(response)

      if (!response.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Error al registrar entrada de stock")
        return
      }

      toast.success("Entrada de stock registrada exitosamente")
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error("Error inesperado al registrar entrada de stock")
    } finally {
      setIsSaving(false)
    }
  }, [isValid, selectedVariante, selectedSucursalId, cantidadNum, motivo, onOpenChange, onSuccess])

  const selectedSucursal = sucursales.find((s) => s.idSucursal === selectedSucursalId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <ArrowDownTrayIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Agregar Stock
          </DialogTitle>
          <DialogDescription>
            Registra una entrada de inventario para una variante de producto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* ── Sucursal ── */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground">
              Sucursal
            </label>

            {!isAdmin ? (
              <div className="flex items-center gap-2.5 rounded-xl border-2 border-blue-500 bg-blue-50 p-2.5 dark:bg-blue-900/15">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <BuildingStorefrontIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {user?.nombreSucursal || `Sucursal #${userSucursalId}`}
                  </p>
                  <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">Tu sucursal asignada</p>
                </div>
                <CheckCircleIcon className="ml-auto h-4 w-4 shrink-0 text-blue-500" />
              </div>
            ) : loadingSucursales ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : sucursales.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay sucursales disponibles.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {sucursales.map((s) => (
                  <SucursalMiniCard
                    key={s.idSucursal}
                    sucursal={s}
                    selected={selectedSucursalId === s.idSucursal}
                    onSelect={() => setSelectedSucursalId(s.idSucursal)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Producto / Variante ── */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground">
              Producto / Variante
            </label>

            {selectedVariante ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-blue-500 bg-blue-50 px-3 py-2.5 dark:bg-blue-900/15">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800">
                    {selectedVariante.imagenPrincipal?.urlThumb ? (
                      <Image
                        src={selectedVariante.imagenPrincipal.urlThumb}
                        alt={selectedVariante.producto?.nombre ?? "Producto"}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-100 dark:bg-blue-900/40">
                        <CubeIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {selectedVariante.producto?.nombre ?? "Producto"}
                    </p>
                    <p className="truncate text-[10px] text-blue-600/70 dark:text-blue-400/70">
                      {selectedVariante.color?.nombre ?? ""} / {selectedVariante.talla?.nombre ?? ""}
                      {selectedVariante.sku ? ` — ${selectedVariante.sku}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedVariante(null); setVarianteQuery(""); setVarianteResults([]) }}
                  className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={varianteQuery}
                    onChange={(e) => setVarianteQuery(e.target.value)}
                    placeholder="Buscar por nombre, SKU o codigo de barras..."
                    className="w-full rounded-lg border bg-background py-2 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {loadingVariantes && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                  )}
                </div>

                {!loadingVariantes && varianteResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border bg-card shadow-sm">
                    {varianteResults.map((v) => (
                      <button
                        key={v.idProductoVariante}
                        type="button"
                        onClick={() => { setSelectedVariante(v); setVarianteQuery(""); setVarianteResults([]) }}
                        className="flex w-full items-center gap-2.5 border-b px-3 py-2 text-left transition-colors last:border-0 hover:bg-muted/50"
                      >
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          {v.imagenPrincipal?.urlThumb ? (
                            <Image
                              src={v.imagenPrincipal.urlThumb}
                              alt={v.producto?.nombre ?? "Producto"}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <CubeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {v.producto?.nombre ?? "Producto"}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {v.color?.nombre ?? ""} / {v.talla?.nombre ?? ""}
                            {v.sku ? ` — ${v.sku}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-semibold">{v.stock ?? 0}</p>
                          <p className="text-[9px] text-muted-foreground">stock</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!loadingVariantes && varianteQuery.trim().length >= 2 && varianteResults.length === 0 && (
                  <p className="px-1 text-[10px] text-muted-foreground">No se encontraron variantes.</p>
                )}
              </div>
            )}
          </div>

          {/* ── Stock Preview (when variant selected) ── */}
          {selectedVariante && (
            <div
              className={`rounded-xl border-2 p-3 ${
                cantidadValida > 0
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10"
                  : "border-border bg-muted/20"
              }`}
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Impacto en stock
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Actual</p>
                  <p className="text-xl font-bold tabular-nums">{stockActual}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      cantidadValida > 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {cantidadValida > 0 ? `+${cantidadValida}` : "—"}
                  </div>
                  <div className="h-px w-8 bg-border" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Final</p>
                  <p
                    className={`text-xl font-bold tabular-nums ${
                      cantidadValida > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : ""
                    }`}
                  >
                    {cantidadValida > 0 ? stockFinal : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Cantidad & Motivo ── */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej. 10"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Motivo <span className="text-muted-foreground">(opcional)</span>
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value.slice(0, 150))}
                placeholder="Ej. Ingreso por compra"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-right text-[10px] text-muted-foreground">{motivo.length}/150</p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Registrando...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  Registrar Entrada
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
