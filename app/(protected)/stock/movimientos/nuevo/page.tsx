"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  QrCodeIcon,
  TagIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"
import { isAdministratorRole } from "@/lib/auth/roles"
import { useCanFilterBySucursal } from "@/lib/hooks/useCanFilterByUsuario"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useGlobalBarcodeScanner } from "@/lib/hooks/useGlobalBarcodeScanner"
import { resolveBackendUrl } from "@/lib/resolve-backend-url"
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
  grupoImagen: { key: string; idProducto: number; idColor: number } | null
  imagenPrincipal: { url: string; urlThumb: string } | null
}

type TipoMovimiento = "ENTRADA" | "SALIDA"

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function buildImageMap(imagenesPorColor: unknown): Map<string, { url: string; urlThumb: string }> {
  const map = new Map<string, { url: string; urlThumb: string }>()
  if (!Array.isArray(imagenesPorColor)) return map
  for (const group of imagenesPorColor) {
    if (!group || typeof group !== "object") continue
    const g = group as Record<string, unknown>
    const key = typeof g.key === "string" ? g.key : null
    if (!key) continue
    const img = g.imagenPrincipal as Record<string, unknown> | null
    const rawUrl = typeof img?.url === "string" ? img.url : ""
    const rawUrlThumb = typeof img?.urlThumb === "string" ? img.urlThumb : rawUrl
    const url = resolveBackendUrl(rawUrl) ?? rawUrl
    const urlThumb = resolveBackendUrl(rawUrlThumb) ?? rawUrlThumb
    if (url || urlThumb) map.set(key, { url, urlThumb })
  }
  return map
}

function applyImages(
  items: VarianteSearchItem[],
  imageMap: Map<string, { url: string; urlThumb: string }>
): VarianteSearchItem[] {
  return items.map((item) => {
    const key = item.grupoImagen?.key
    if (!key) return item
    const img = imageMap.get(key)
    if (!img) return item
    return { ...item, imagenPrincipal: img }
  })
}

function getVariantImageUrl(item: Pick<VarianteSearchItem, "imagenPrincipal">): string | null {
  return item.imagenPrincipal?.url || item.imagenPrincipal?.urlThumb || null
}

function TipoSelector({
  value,
  onChange,
}: {
  value: TipoMovimiento
  onChange: (v: TipoMovimiento) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["ENTRADA", "SALIDA"] as TipoMovimiento[]).map((tipo) => {
        const isSelected = value === tipo
        const isEntrada = tipo === "ENTRADA"
        return (
          <button
            key={tipo}
            type="button"
            onClick={() => onChange(tipo)}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-5 text-sm font-semibold transition-all ${
              isSelected
                ? isEntrada
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "border-red-500 bg-red-50 text-red-700 shadow-sm dark:border-red-500 dark:bg-red-900/20 dark:text-red-400"
                : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/50"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isSelected
                  ? isEntrada
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : "bg-red-100 dark:bg-red-900/40"
                  : "bg-muted"
              }`}
            >
              {isEntrada ? (
                <ArrowDownTrayIcon className="h-5 w-5" />
              ) : (
                <ArrowUpTrayIcon className="h-5 w-5" />
              )}
            </div>
            {isEntrada ? "Entrada" : "Salida"}
            <span className="text-xs font-normal opacity-70">
              {isEntrada ? "Suma stock" : "Descuenta stock"}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SucursalCard({
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
      className={`relative flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-500 dark:bg-blue-900/15"
          : "border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/30"
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          selected
            ? "bg-blue-100 dark:bg-blue-900/40"
            : "bg-muted"
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
          className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
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

function StockPreviewCard({
  variante,
  tipo,
  cantidad,
}: {
  variante: VarianteSearchItem
  tipo: TipoMovimiento
  cantidad: number
}) {
  const stockActual = variante.stock ?? 0
  const cantidadValida = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 0
  const stockFinal =
    tipo === "ENTRADA" ? stockActual + cantidadValida : stockActual - cantidadValida
  const diff = stockFinal - stockActual
  const isInsuficiente = tipo === "SALIDA" && cantidadValida > 0 && stockFinal < 0
  const isEntrada = tipo === "ENTRADA"

  return (
    <div className="space-y-4">
      {/* Producto info */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
            {getVariantImageUrl(variante) ? (
              <Image
                src={getVariantImageUrl(variante)!}
                alt={variante.producto?.nombre ?? "Producto"}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <CubeIcon className="h-6 w-6 text-slate-400" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{variante.producto?.nombre ?? "Producto"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {variante.color?.nombre ?? ""}{variante.talla?.nombre ? ` / ${variante.talla.nombre}` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {variante.sku && (
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">SKU</p>
              <p className="truncate text-sm font-medium">{variante.sku}</p>
            </div>
          )}
          {variante.precio !== null && (
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Precio</p>
              <p className="text-sm font-medium">
                S/ {(variante.precio ?? 0).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {variante.color?.hex && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: variante.color.hex }}
            />
            <span className="text-xs text-muted-foreground">{variante.color.nombre}</span>
            <span className="mx-1 text-muted-foreground">·</span>
            <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{variante.talla?.nombre ?? "—"}</span>
          </div>
        )}
      </div>

      {/* Stock preview */}
      <div
        className={`rounded-xl border-2 p-4 ${
          isInsuficiente
            ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10"
            : isEntrada
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10"
              : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10"
        }`}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Impacto en stock
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Actual</p>
            <p className="text-2xl font-bold tabular-nums">{stockActual}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`rounded-full px-2.5 py-1 text-sm font-bold ${
                isInsuficiente
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : isEntrada
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              }`}
            >
              {cantidadValida > 0
                ? `${isEntrada ? "+" : "-"}${cantidadValida}`
                : "—"}
            </div>
            <div className="h-px w-10 bg-border" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Final</p>
            <p
              className={`text-2xl font-bold tabular-nums ${
                isInsuficiente
                  ? "text-red-600 dark:text-red-400"
                  : cantidadValida > 0 && isEntrada
                    ? "text-emerald-600 dark:text-emerald-400"
                    : cantidadValida > 0
                      ? "text-orange-600 dark:text-orange-400"
                      : ""
              }`}
            >
              {cantidadValida > 0 ? stockFinal : "—"}
            </p>
          </div>
        </div>

        {isInsuficiente && (
          <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Stock insuficiente. Disponible: {stockActual}, solicitado: {cantidadValida}
          </p>
        )}

        {!isInsuficiente && cantidadValida > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {isEntrada
              ? `Se agregarán ${cantidadValida} unidades al inventario.`
              : `Se descontarán ${cantidadValida} unidades del inventario.`}
          </p>
        )}
      </div>
    </div>
  )
}

export default function NuevoMovimientoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isAdmin = isAdministratorRole(user?.rol)
  const canFilterBySucursal = useCanFilterBySucursal()
  const isMultiSucursalNonAdmin = !isAdmin && canFilterBySucursal && (user?.sucursalesPermitidas ?? []).length > 1

  const userSucursalId =
    typeof user?.idSucursal === "number" && user.idSucursal > 0
      ? user.idSucursal
      : null

  const { sucursales, loadingSucursales } = useSucursalOptions(true)

  const sucursalesOrigen = useMemo(
    () =>
      isAdmin
        ? sucursales
        : isMultiSucursalNonAdmin
          ? sucursales.filter((s) =>
              (user?.sucursalesPermitidas ?? []).some(
                (sp) => sp.idSucursal === s.idSucursal
              )
            )
          : sucursales,
    [isAdmin, isMultiSucursalNonAdmin, sucursales, user?.sucursalesPermitidas]
  )

  const paramSucursalId = Number(searchParams.get("idSucursal") ?? "") || null
  const paramCodigoBarras = searchParams.get("codigoBarras") ?? ""

  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)

  useEffect(() => {
    if (paramSucursalId) {
      setSelectedSucursalId(paramSucursalId)
    } else if (!isAdmin && userSucursalId) {
      setSelectedSucursalId(userSucursalId)
    }
  }, [isAdmin, isMultiSucursalNonAdmin, userSucursalId, paramSucursalId])

  // --- Variante search ---
  const [varianteQuery, setVarianteQuery] = useState(() => paramCodigoBarras || (searchParams.get("q") ?? ""))
  const [varianteResults, setVarianteResults] = useState<VarianteSearchItem[]>([])
  const [loadingVariantes, setLoadingVariantes] = useState(false)
  const [selectedVariante, setSelectedVariante] = useState<VarianteSearchItem | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)
  const selectedVarianteRef = useRef<VarianteSearchItem | null>(null)
  selectedVarianteRef.current = selectedVariante

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
        const imageMap = buildImageMap(data.imagenesPorColor)
        setVarianteResults(applyImages((data.content as VarianteSearchItem[]).slice(0, 10), imageMap))
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
    const timer = setTimeout(() => {
      if (varianteQuery.trim().length >= 2) {
        searchVariantes(varianteQuery, selectedSucursalId)
      } else {
        setVarianteResults([])
        setLoadingVariantes(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [varianteQuery, selectedSucursalId, searchVariantes])

  useEffect(() => () => searchAbortRef.current?.abort(), [])

  // Auto-select variant when arriving from barcode scan error
  useEffect(() => {
    if (!paramCodigoBarras) return

    const controller = new AbortController()
    setLoadingVariantes(true)

    const run = async () => {
      try {
        const params = new URLSearchParams({ q: paramCodigoBarras, page: "0" })
        if (paramSucursalId) params.set("idSucursal", String(paramSucursalId))
        const response = await authFetch(`/api/variante/listar-resumen?${params.toString()}`, {
          signal: controller.signal,
        })
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (response.ok && data?.content) {
          const imageMap = buildImageMap(data.imagenesPorColor)
          const results = applyImages((data.content as VarianteSearchItem[]).slice(0, 10), imageMap)
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

  // Re-fetch selected variant stock when sucursal changes
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
  }, [selectedSucursalId])

  // --- Barcode scanner ---
  const [scanningBarcode, setScanningBarcode] = useState(false)

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      setScanningBarcode(true)
      try {
        const params = new URLSearchParams({ q: barcode.trim(), page: "0" })
        if (selectedSucursalId) params.set("idSucursal", String(selectedSucursalId))
        const response = await authFetch(`/api/variante/listar-resumen?${params.toString()}`)
        const data = await parseJsonSafe(response)
        if (response.ok && data?.content) {
          const imageMap = buildImageMap(data.imagenesPorColor)
          const results = applyImages((data.content as VarianteSearchItem[]).slice(0, 10), imageMap)
          if (results.length === 1) {
            setSelectedVariante(results[0])
            setVarianteQuery("")
            setVarianteResults([])
          } else if (results.length > 1) {
            setVarianteQuery(barcode)
            setVarianteResults(results)
          } else {
            toast.error("No se encontró ningún producto con ese código de barras.")
          }
        } else {
          toast.error("Error al escanear el código de barras.")
        }
      } catch {
        toast.error("Error al escanear el código de barras.")
      } finally {
        setScanningBarcode(false)
      }
    },
    [selectedSucursalId]
  )

  const { active: scannerActive, toggle: toggleScanner } = useGlobalBarcodeScanner({
    onScan: handleBarcodeScan,
  })

  // --- Form ---
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("ENTRADA")
  const [cantidad, setCantidad] = useState("")
  const [motivo, setMotivo] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const cantidadNum = parseInt(cantidad, 10)
  const stockActual = selectedVariante?.stock ?? 0
  const isInsuficiente =
    tipoMovimiento === "SALIDA" &&
    Number.isFinite(cantidadNum) &&
    cantidadNum > 0 &&
    cantidadNum > stockActual

  const isValid =
    selectedSucursalId !== null &&
    selectedVariante !== null &&
    Number.isFinite(cantidadNum) &&
    cantidadNum > 0 &&
    !isInsuficiente

  const handleSubmit = async () => {
    if (!isValid || !selectedVariante) return

    setIsSaving(true)
    try {
      const response = await authFetch("/api/sucursal-stock/movimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idSucursal: selectedSucursalId,
          idProductoVariante: selectedVariante.idProductoVariante,
          tipoMovimiento,
          cantidad: cantidadNum,
          motivo: motivo.trim() || undefined,
        }),
      })

      const data = await parseJsonSafe(response)

      if (!response.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Error al registrar movimiento")
        return
      }

      toast.success("Movimiento registrado exitosamente")
      router.push("/stock/movimientos")
    } catch {
      toast.error("Error inesperado al registrar movimiento")
    } finally {
      setIsSaving(false)
    }
  }

  const selectedSucursal = sucursales.find((s) => s.idSucursal === selectedSucursalId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/stock/movimientos"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nuevo Movimiento</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Registra una entrada o salida manual de inventario.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Columna izquierda: formulario ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Tipo de movimiento */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Tipo de movimiento
            </h2>
            <TipoSelector value={tipoMovimiento} onChange={(v) => { setTipoMovimiento(v); setCantidad("") }} />
          </div>

          {/* Sucursales */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Sucursal</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Selecciona la sucursal donde se registrará el movimiento.
            </p>

            {!isAdmin && !isMultiSucursalNonAdmin ? (
              <div className="flex items-center gap-3 rounded-xl border-2 border-blue-500 bg-blue-50 p-3.5 dark:bg-blue-900/15">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <BuildingStorefrontIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {user?.nombreSucursal || `Sucursal #${userSucursalId}`}
                  </p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Tu sucursal asignada</p>
                </div>
                <CheckCircleIcon className="ml-auto h-5 w-5 shrink-0 text-blue-500" />
              </div>
            ) : loadingSucursales && !isMultiSucursalNonAdmin ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : sucursalesOrigen.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay sucursales disponibles.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {sucursalesOrigen.map((s) => (
                  <SucursalCard
                    key={s.idSucursal}
                    sucursal={s}
                    selected={selectedSucursalId === s.idSucursal}
                    onSelect={() => setSelectedSucursalId(s.idSucursal)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Producto / Variante */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Producto / Variante</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Busca por nombre de producto, SKU o código de barras.
            </p>

            {selectedVariante ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-blue-500 bg-blue-50 px-4 py-3 dark:bg-blue-900/15">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800">
                    {getVariantImageUrl(selectedVariante) ? (
                      <Image
                        src={getVariantImageUrl(selectedVariante)!}
                        alt={selectedVariante.producto?.nombre ?? "Producto"}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-100 dark:bg-blue-900/40">
                        <CubeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {selectedVariante.producto?.nombre ?? "Producto"}
                    </p>
                    <p className="truncate text-xs text-blue-600/70 dark:text-blue-400/70">
                      {selectedVariante.color?.nombre ?? ""} / {selectedVariante.talla?.nombre ?? ""}
                      {selectedVariante.sku ? ` — ${selectedVariante.sku}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedVariante(null); setVarianteQuery(""); setVarianteResults([]) }}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={varianteQuery}
                      onChange={(e) => setVarianteQuery(e.target.value)}
                      placeholder="Buscar por nombre, SKU o codigo de barras..."
                      className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {loadingVariantes && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={toggleScanner}
                    className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      scannerActive
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-200"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                    }`}
                    title="Escanear codigo de barras"
                    aria-pressed={scannerActive}
                  >
                    <QrCodeIcon className="h-4 w-4" />
                    Escaner
                    {scanningBarcode && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />}
                  </button>
                </div>

                {!loadingVariantes && varianteResults.length > 0 && (
                  <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                    {varianteResults.map((v) => (
                      <button
                        key={v.idProductoVariante}
                        type="button"
                        onClick={() => { setSelectedVariante(v); setVarianteQuery(""); setVarianteResults([]) }}
                        className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50"
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          {getVariantImageUrl(v) ? (
                            <Image
                              src={getVariantImageUrl(v)!}
                              alt={v.producto?.nombre ?? "Producto"}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <CubeIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {v.producto?.nombre ?? "Producto"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {v.color?.nombre ?? ""} / {v.talla?.nombre ?? ""}
                            {v.sku ? ` — ${v.sku}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold">{v.stock ?? 0}</p>
                          <p className="text-xs text-muted-foreground">en stock</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!loadingVariantes && varianteQuery.trim().length >= 2 && varianteResults.length === 0 && (
                  <p className="px-1 text-xs text-muted-foreground">No se encontraron variantes.</p>
                )}

                {varianteQuery.trim().length < 2 && varianteQuery.trim().length > 0 && (
                  <p className="px-1 text-xs text-muted-foreground">Escribe al menos 2 caracteres para buscar.</p>
                )}
              </div>
            )}
          </div>

          {/* Cantidad y Motivo */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Detalles del movimiento</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <div className={`flex h-10 items-stretch overflow-hidden rounded-lg border ${
                  isInsuficiente ? "border-red-400" : "border-input"
                }`}>
                  <button
                    type="button"
                    onClick={() => setCantidad(String(Math.max(1, (Number.isFinite(cantidadNum) ? cantidadNum : 1) - 1)))}
                    className="flex w-10 shrink-0 items-center justify-center border-r bg-muted/50 text-muted-foreground transition-colors hover:bg-muted active:bg-muted/80"
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="0"
                    className="w-full bg-background px-2 text-center text-sm tabular-nums placeholder:text-muted-foreground focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCantidad(String((Number.isFinite(cantidadNum) && cantidadNum > 0 ? cantidadNum : 0) + 1))}
                    className="flex w-10 shrink-0 items-center justify-center border-l bg-muted/50 text-muted-foreground transition-colors hover:bg-muted active:bg-muted/80"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isInsuficiente && (
                  <p className="text-xs text-red-500">
                    Stock insuficiente. Disponible: {stockActual}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Motivo <span className="text-muted-foreground">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value.slice(0, 150))}
                  placeholder={tipoMovimiento === "ENTRADA" ? "Ej. Ingreso por compra" : "Ej. Merma de producto"}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-right text-xs text-muted-foreground">{motivo.length}/150</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/stock/movimientos"
              className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSaving}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                tipoMovimiento === "ENTRADA"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Registrando...
                </>
              ) : (
                <>
                  {tipoMovimiento === "ENTRADA" ? (
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  ) : (
                    <ArrowUpTrayIcon className="h-4 w-4" />
                  )}
                  Registrar {tipoMovimiento === "ENTRADA" ? "Entrada" : "Salida"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Columna derecha: preview ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {selectedVariante ? (
              <StockPreviewCard
                variante={selectedVariante}
                tipo={tipoMovimiento}
                cantidad={cantidadNum}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CubeIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Selecciona un producto
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Aqui verás el impacto del movimiento en el stock
                </p>
              </div>
            )}

            {/* Resumen del movimiento */}
            {selectedSucursal && selectedVariante && (
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resumen
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Tipo</span>
                    <span
                      className={`font-semibold ${
                        tipoMovimiento === "ENTRADA"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {tipoMovimiento === "ENTRADA" ? "Entrada" : "Salida"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Sucursal</span>
                    <span className="truncate text-right font-medium">{selectedSucursal.nombre}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Producto</span>
                    <span className="truncate text-right font-medium">
                      {selectedVariante.producto?.nombre ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Variante</span>
                    <span className="font-medium">
                      {selectedVariante.color?.nombre ?? ""} / {selectedVariante.talla?.nombre ?? ""}
                    </span>
                  </div>
                  {Number.isFinite(cantidadNum) && cantidadNum > 0 && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Cantidad</span>
                      <span className="font-semibold">{cantidadNum}</span>
                    </div>
                  )}
                  {motivo.trim() && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Motivo</span>
                      <span className="truncate text-right font-medium">{motivo}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
