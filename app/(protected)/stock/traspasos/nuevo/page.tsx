"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowLongRightIcon,
  ArrowsRightLeftIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { Sucursal } from "@/lib/types/sucursal"
import type { TrasladoCreateRequest } from "@/lib/types/traslado"
import type { VarianteResumenItem } from "@/lib/types/variante"

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  try { return (await res.json()) as T } catch { return null }
}

// ─── Item de traspaso (variante + cantidad) ──────────────────────────────────

interface TraspasoItem {
  variante: VarianteResumenItem
  cantidad: number
}

// ─── Sucursal card ────────────────────────────────────────────────────────────

function SucursalCard({
  sucursal,
  selected,
  disabled = false,
  onSelect,
}: {
  sucursal: Sucursal
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  const isAlmacen = sucursal.tipo === "ALMACEN"
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`relative flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all disabled:cursor-not-allowed ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-500 dark:bg-blue-900/15"
          : "border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/30"
      } ${disabled && !selected ? "opacity-60" : ""}`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          selected ? "bg-blue-100 dark:bg-blue-900/40" : "bg-muted"
        }`}
      >
        <BuildingStorefrontIcon
          className={`h-4 w-4 ${selected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${selected ? "text-blue-700 dark:text-blue-300" : "text-foreground"}`}>
          {sucursal.nombre}
        </p>
        {sucursal.ciudad && (
          <p className="truncate text-xs text-muted-foreground">{sucursal.ciudad}</p>
        )}
        <span
          className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isAlmacen
              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          }`}
        >
          {isAlmacen ? "Almacen" : "Venta"}
        </span>
      </div>
      {selected && (
        <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 shrink-0 text-blue-500" />
      )}
    </button>
  )
}

// ─── Step header ─────────────────────────────────────────────────────────────

function StepHeader({
  number,
  title,
  subtitle,
  done,
}: {
  number: number
  title: string
  subtitle: string
  done: boolean
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? "bg-emerald-500 text-white"
            : "bg-blue-600 text-white"
        }`}
      >
        {done ? <CheckCircleIcon className="h-4 w-4" /> : number}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

// ─── Item row in sidebar ─────────────────────────────────────────────────────

function ItemRow({
  item,
  onRemove,
  onCantidadChange,
}: {
  item: TraspasoItem
  onRemove: () => void
  onCantidadChange: (cantidad: number) => void
}) {
  const variantLabel = [item.variante.color?.nombre, item.variante.talla?.nombre]
    .filter(Boolean)
    .join(" / ")
  const stockActual = item.variante.stock ?? 0
  const insuficiente = item.cantidad > stockActual

  return (
    <div
      className={`rounded-lg border p-3 ${
        insuficiente
          ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10"
          : "border-border bg-muted/20"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {item.variante.imagenPrincipal?.urlThumb ? (
            <Image
              src={item.variante.imagenPrincipal.urlThumb}
              alt={item.variante.producto?.nombre ?? ""}
              fill sizes="40px" className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <CubeIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{item.variante.producto?.nombre}</p>
          <p className="truncate text-xs text-muted-foreground">
            {variantLabel || "Sin atributos"}
            {item.variante.sku ? ` — ${item.variante.sku}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Stock: <span className="font-medium">{stockActual}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Cant:</label>
        <input
          type="number"
          min={1}
          step={1}
          value={item.cantidad}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10)
            if (Number.isInteger(v) && v > 0) onCantidadChange(v)
          }}
          className={`w-20 rounded-md border bg-background px-2 py-1 text-xs tabular-nums focus:outline-none focus:ring-2 ${
            insuficiente
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
              : "focus:border-blue-500 focus:ring-blue-500/20"
          }`}
        />
        {insuficiente && (
          <span className="text-xs text-red-500">Insuficiente</span>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NuevoTraspasoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { sucursales, loadingSucursales } = useSucursalOptions(true)

  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userSucursalId =
    typeof user?.idSucursal === "number" && user.idSucursal > 0 ? user.idSucursal : null

  const [idSucursalOrigen, setIdSucursalOrigen] = useState<number | null>(null)
  const [idSucursalDestino, setIdSucursalDestino] = useState<number | null>(null)
  const [searchVariante, setSearchVariante] = useState("")
  const [variantes, setVariantes] = useState<VarianteResumenItem[]>([])
  const [loadingVariantes, setLoadingVariantes] = useState(false)
  const [items, setItems] = useState<TraspasoItem[]>([])
  const [motivo, setMotivo] = useState("")
  const [saving, setSaving] = useState(false)

  const searchAbortRef = useRef<AbortController | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sucursalesActivas = useMemo(
    () => sucursales.filter((s) => s.estado === "ACTIVO"),
    [sucursales]
  )

  const sucursalOrigen = useMemo(
    () => sucursalesActivas.find((s) => s.idSucursal === idSucursalOrigen) ?? null,
    [sucursalesActivas, idSucursalOrigen]
  )

  const sucursalDestino = useMemo(
    () => sucursalesActivas.find((s) => s.idSucursal === idSucursalDestino) ?? null,
    [sucursalesActivas, idSucursalDestino]
  )

  const sucursalesDestino = useMemo(
    () => sucursalesActivas.filter((s) => s.idSucursal !== idSucursalOrigen),
    [sucursalesActivas, idSucursalOrigen]
  )

  const addedVarianteIds = useMemo(
    () => new Set(items.map((i) => i.variante.idProductoVariante)),
    [items]
  )

  useEffect(() => {
    if (!isAdmin && userSucursalId) setIdSucursalOrigen(userSucursalId)
  }, [isAdmin, userSucursalId])

  useEffect(() => {
    setItems([])
    setVariantes([])
    setSearchVariante("")
    if (idSucursalDestino === idSucursalOrigen) setIdSucursalDestino(null)
  }, [idSucursalOrigen, idSucursalDestino])

  const fetchVariantes = useCallback(
    async (query: string, origenId: number, signal: AbortSignal) => {
      setLoadingVariantes(true)
      try {
        const params = new URLSearchParams({ page: "0", q: query, idSucursal: String(origenId), soloDisponibles: "true" })
        const res = await authFetch(`/api/variante/listar-resumen?${params.toString()}`, { signal })
        const data = await parseJsonSafe<{ content?: VarianteResumenItem[] }>(res)
        if (!res.ok) { setVariantes([]); return }
        setVariantes(Array.isArray(data?.content) ? data.content.slice(0, 12) : [])
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") setVariantes([])
      } finally {
        setLoadingVariantes(false)
      }
    },
    []
  )

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchAbortRef.current?.abort()

    if (!idSucursalOrigen || searchVariante.trim().length < 2) {
      setVariantes([])
      setLoadingVariantes(false)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      const ctrl = new AbortController()
      searchAbortRef.current = ctrl
      void fetchVariantes(searchVariante.trim(), idSucursalOrigen, ctrl.signal)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      searchAbortRef.current?.abort()
    }
  }, [fetchVariantes, idSucursalOrigen, searchVariante])

  useEffect(() => () => { searchAbortRef.current?.abort() }, [])

  const addItem = (variante: VarianteResumenItem) => {
    if (addedVarianteIds.has(variante.idProductoVariante)) return
    setItems((prev) => [...prev, { variante, cantidad: 1 }])
    setSearchVariante("")
    setVariantes([])
  }

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateItemCantidad = (idx: number, cantidad: number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, cantidad } : item)))
  }

  const totalCantidad = items.reduce((sum, i) => sum + i.cantidad, 0)
  const hasStockInsuficiente = items.some((i) => i.cantidad > (i.variante.stock ?? 0))

  const canSubmit =
    !saving &&
    Boolean(idSucursalOrigen) &&
    Boolean(idSucursalDestino) &&
    items.length > 0 &&
    idSucursalOrigen !== idSucursalDestino &&
    !hasStockInsuficiente

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!idSucursalOrigen || !idSucursalDestino || items.length === 0) return

    const payload: TrasladoCreateRequest = {
      idSucursalOrigen,
      idSucursalDestino,
      items: items.map((i) => ({
        idProductoVariante: i.variante.idProductoVariante,
        cantidad: i.cantidad,
      })),
      motivo: motivo.trim() || undefined,
    }

    setSaving(true)
    try {
      const res = await authFetch("/api/traslado/insertar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await parseJsonSafe<{ message?: string; totalItems?: number }>(res)
      if (!res.ok) { toast.error(body?.message ?? "No se pudo registrar el traspaso"); return }
      toast.success(
        items.length === 1
          ? "Traspaso registrado correctamente"
          : `Traspaso de ${items.length} productos registrado correctamente`
      )
      router.push("/stock/traspasos")
    } catch {
      toast.error("No se pudo registrar el traspaso")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/stock/traspasos"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground">Nuevo Traspaso</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Mueve unidades de inventario entre sucursales.
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 sm:inline-flex">
          <ArrowsRightLeftIcon className="h-4 w-4" />
          Traspaso grupal
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">

        {/* ── Columna izquierda ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Paso 1: Origen */}
          <div className="rounded-xl border bg-card p-5">
            <StepHeader
              number={1}
              title="Sucursal de origen"
              subtitle="Desde donde se retirara el stock."
              done={Boolean(idSucursalOrigen)}
            />

            {loadingSucursales ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : !isAdmin && !userSucursalId ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
                Tu usuario no tiene sucursal asignada para operar traspasos.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(isAdmin ? sucursalesActivas : sucursalesActivas.filter((s) => s.idSucursal === userSucursalId)).map((s) => (
                  <SucursalCard
                    key={s.idSucursal}
                    sucursal={s}
                    selected={idSucursalOrigen === s.idSucursal}
                    disabled={!isAdmin}
                    onSelect={() => setIdSucursalOrigen(s.idSucursal)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Paso 2: Destino */}
          <div className="rounded-xl border bg-card p-5">
            <StepHeader
              number={2}
              title="Sucursal de destino"
              subtitle="Hacia donde se enviara el stock."
              done={Boolean(idSucursalDestino)}
            />

            {!idSucursalOrigen ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/15 dark:text-amber-400">
                Primero selecciona una sucursal de origen.
              </div>
            ) : sucursalesDestino.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                No hay otras sucursales disponibles como destino.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {sucursalesDestino.map((s) => (
                  <SucursalCard
                    key={s.idSucursal}
                    sucursal={s}
                    selected={idSucursalDestino === s.idSucursal}
                    onSelect={() => setIdSucursalDestino(s.idSucursal)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Paso 3: Productos */}
          <div className="rounded-xl border bg-card p-5">
            <StepHeader
              number={3}
              title="Productos a traspasar"
              subtitle="Busca y agrega uno o mas productos."
              done={items.length > 0 && !hasStockInsuficiente}
            />

            {!idSucursalOrigen ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/15 dark:text-amber-400">
                Selecciona una sucursal de origen para buscar productos.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Buscador */}
                <div className="space-y-2">
                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchVariante}
                      onChange={(e) => setSearchVariante(e.target.value)}
                      placeholder="Buscar por nombre, SKU o codigo de barras..."
                      className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {loadingVariantes && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      </div>
                    )}
                  </div>

                  {!loadingVariantes && variantes.length > 0 && (
                    <div className="max-h-72 overflow-y-auto overflow-hidden rounded-lg border bg-card shadow-sm">
                      {variantes.map((v) => {
                        const vLabel = [v.color?.nombre, v.talla?.nombre].filter(Boolean).join(" / ")
                        const alreadyAdded = addedVarianteIds.has(v.idProductoVariante)
                        return (
                          <button
                            key={v.idProductoVariante}
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => addItem(v)}
                            className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 ${
                              alreadyAdded
                                ? "cursor-not-allowed opacity-50"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                              {v.imagenPrincipal?.urlThumb ? (
                                <Image
                                  src={v.imagenPrincipal.urlThumb}
                                  alt={v.producto?.nombre ?? ""}
                                  fill sizes="40px" className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <CubeIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{v.producto?.nombre ?? "Producto"}</p>
                              <p className="truncate text-xs text-muted-foreground">{vLabel || "Sin atributos"}{v.sku ? ` — ${v.sku}` : ""}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              {alreadyAdded ? (
                                <span className="text-xs font-medium text-blue-600">Agregado</span>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold">{v.stock ?? 0}</p>
                                  <p className="text-xs text-muted-foreground">en stock</p>
                                </>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {!loadingVariantes && searchVariante.trim().length >= 2 && variantes.length === 0 && (
                    <p className="px-1 text-xs text-muted-foreground">No se encontraron variantes con stock disponible.</p>
                  )}
                  {searchVariante.trim().length > 0 && searchVariante.trim().length < 2 && (
                    <p className="px-1 text-xs text-muted-foreground">Escribe al menos 2 caracteres para buscar.</p>
                  )}
                </div>

                {/* Lista de items agregados */}
                {items.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Productos agregados ({items.length})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total: {totalCantidad} unid.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {items.map((item, idx) => {
                        const variantLabel = [item.variante.color?.nombre, item.variante.talla?.nombre]
                          .filter(Boolean)
                          .join(" / ")
                        const stockActual = item.variante.stock ?? 0
                        const insuficiente = item.cantidad > stockActual

                        return (
                          <div
                            key={item.variante.idProductoVariante}
                            className={`flex items-center gap-3 rounded-lg border p-3 ${
                              insuficiente
                                ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10"
                                : "border-border bg-muted/20"
                            }`}
                          >
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                              {item.variante.imagenPrincipal?.urlThumb ? (
                                <Image
                                  src={item.variante.imagenPrincipal.urlThumb}
                                  alt={item.variante.producto?.nombre ?? ""}
                                  fill sizes="40px" className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <CubeIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {item.variante.producto?.nombre}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {variantLabel || "Sin atributos"}
                                {item.variante.sku ? ` — ${item.variante.sku}` : ""}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Stock origen: <span className="font-medium">{stockActual}</span>
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={item.cantidad}
                                onChange={(e) => {
                                  const v = Number.parseInt(e.target.value, 10)
                                  if (Number.isInteger(v) && v > 0) updateItemCantidad(idx, v)
                                }}
                                className={`w-16 rounded-md border bg-background px-2 py-1.5 text-center text-sm tabular-nums focus:outline-none focus:ring-2 ${
                                  insuficiente
                                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                    : "focus:border-blue-500 focus:ring-blue-500/20"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            {insuficiente && (
                              <span className="shrink-0 text-xs font-medium text-red-500">
                                Insuficiente
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Motivo */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Motivo <span className="text-muted-foreground">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={255}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej. Reposicion semanal"
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-right text-xs text-muted-foreground">{motivo.length}/255</p>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/stock/traspasos"
              className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Registrando...
                </>
              ) : (
                <>
                  <ArrowsRightLeftIcon className="h-4 w-4" />
                  Registrar traspaso {items.length > 0 && `(${items.length})`}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Columna derecha: panel lateral ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">

            {/* Flujo visual origen → destino */}
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ruta del traspaso
              </p>
              <div className="flex items-center gap-2">
                <div className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 ${sucursalOrigen ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/15" : "border-dashed border-border bg-muted/20"}`}>
                  {sucursalOrigen ? (
                    <>
                      <p className="truncate text-xs font-semibold text-blue-700 dark:text-blue-300">{sucursalOrigen.nombre}</p>
                      <p className="text-xs text-blue-500/70">{sucursalOrigen.tipo === "ALMACEN" ? "Almacen" : "Venta"}</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Origen</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-center gap-0.5">
                  <ArrowLongRightIcon className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 ${sucursalDestino ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/15" : "border-dashed border-border bg-muted/20"}`}>
                  {sucursalDestino ? (
                    <>
                      <p className="truncate text-xs font-semibold text-emerald-700 dark:text-emerald-300">{sucursalDestino.nombre}</p>
                      <p className="text-xs text-emerald-500/70">{sucursalDestino.tipo === "ALMACEN" ? "Almacen" : "Venta"}</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Destino</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items sidebar */}
            {items.length > 0 ? (
              <div className="rounded-xl border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Productos ({items.length})
                  </p>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {totalCantidad} unid.
                  </span>
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {items.map((item, idx) => (
                    <ItemRow
                      key={item.variante.idProductoVariante}
                      item={item}
                      onRemove={() => removeItem(idx)}
                      onCantidadChange={(c) => updateItemCantidad(idx, c)}
                    />
                  ))}
                </div>

                {hasStockInsuficiente && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <XCircleIcon className="h-4 w-4 shrink-0" />
                    Algunos productos tienen stock insuficiente.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CubeIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Sin productos agregados</p>
                <p className="mt-1 text-xs text-muted-foreground/70">Busca y agrega productos al traspaso</p>
              </div>
            )}

            {/* Resumen */}
            {(sucursalOrigen || sucursalDestino || items.length > 0) && (
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumen</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Origen</dt>
                    <dd className="truncate text-right font-medium">{sucursalOrigen?.nombre ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Destino</dt>
                    <dd className="truncate text-right font-medium">{sucursalDestino?.nombre ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Productos</dt>
                    <dd className="font-semibold">{items.length}</dd>
                  </div>
                  {items.length > 0 && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Total unidades</dt>
                      <dd className="font-semibold">{totalCantidad}</dd>
                    </div>
                  )}
                  {motivo.trim() && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Motivo</dt>
                      <dd className="truncate text-right font-medium">{motivo}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
