"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ArrowDownTrayIcon, ArrowUpTrayIcon, BuildingStorefrontIcon, CheckCircleIcon, CubeIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import type { CatalogVariantItem } from "@/lib/catalog-view"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { StockSucursalVenta } from "@/lib/types/producto"
import type { Sucursal } from "@/lib/types/sucursal"

type TipoMovimiento = "ENTRADA" | "SALIDA"

export interface MovimientoStockSuccessPayload {
  idSucursal: number
  nombreSucursal: string
  tipoMovimiento: TipoMovimiento
  cantidad: number
}

interface MovimientoStockVarianteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variante: CatalogVariantItem | null
  stocksSucursales: StockSucursalVenta[]
  defaultIdSucursal?: number | null
  onSuccess?: (payload: MovimientoStockSuccessPayload) => void
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function getStockForSucursal(stocks: StockSucursalVenta[], idSucursal: number) {
  return stocks.find((stock) => stock.idSucursal === idSucursal)?.stock ?? 0
}

function MovimientoTipoSelector({
  value,
  onChange,
}: {
  value: TipoMovimiento
  onChange: (value: TipoMovimiento) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["ENTRADA", "SALIDA"] as TipoMovimiento[]).map((tipo) => {
        const isEntrada = tipo === "ENTRADA"
        const selected = value === tipo
        return (
          <button
            key={tipo}
            type="button"
            onClick={() => onChange(tipo)}
            className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left text-xs font-semibold transition-all ${
              selected
                ? isEntrada
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                  : "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40"
            }`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              selected ? (isEntrada ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40") : "bg-muted"
            }`}>
              {isEntrada ? <ArrowDownTrayIcon className="h-4 w-4" /> : <ArrowUpTrayIcon className="h-4 w-4" />}
            </span>
            <span>
              {isEntrada ? "Entrada" : "Salida"}
              <span className="block text-[10px] font-normal opacity-70">
                {isEntrada ? "Suma stock" : "Descuenta stock"}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
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
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-blue-100 dark:bg-blue-900/40" : "bg-muted"}`}>
        <BuildingStorefrontIcon className={`h-3.5 w-3.5 ${selected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs font-semibold ${selected ? "text-blue-700 dark:text-blue-300" : "text-foreground"}`}>
          {sucursal.nombre}
        </p>
        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
          isAlmacen
            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        }`}>
          {isAlmacen ? "Almacen" : "Venta"}
        </span>
      </div>
      {selected && <CheckCircleIcon className="h-4 w-4 shrink-0 text-blue-500" />}
    </button>
  )
}

export function MovimientoStockVarianteModal({
  open,
  onOpenChange,
  variante,
  stocksSucursales,
  defaultIdSucursal = null,
  onSuccess,
}: MovimientoStockVarianteModalProps) {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userSucursalId =
    typeof user?.idSucursal === "number" && user.idSucursal > 0 ? user.idSucursal : null
  const { sucursales, loadingSucursales } = useSucursalOptions(open)

  const initialSucursalId = useMemo(() => {
    if (!open) return null
    if (typeof defaultIdSucursal === "number" && defaultIdSucursal > 0) return defaultIdSucursal
    if (!isAdmin) return userSucursalId
    if (stocksSucursales.length === 1) return stocksSucursales[0]?.idSucursal ?? null
    return null
  }, [defaultIdSucursal, isAdmin, open, stocksSucursales, userSucursalId])

  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(initialSucursalId)
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("ENTRADA")
  const [cantidad, setCantidad] = useState("")
  const [motivo, setMotivo] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedSucursalId(initialSucursalId)
    setTipoMovimiento("ENTRADA")
    setCantidad("")
    setMotivo("")
  }, [initialSucursalId, open])

  const selectedSucursal = sucursales.find((sucursal) => sucursal.idSucursal === selectedSucursalId)
  const selectedStockName =
    selectedSucursal?.nombre ??
    stocksSucursales.find((stock) => stock.idSucursal === selectedSucursalId)?.nombreSucursal ??
    user?.nombreSucursal ??
    (selectedSucursalId ? `Sucursal #${selectedSucursalId}` : "")

  const cantidadNum = parseInt(cantidad, 10)
  const cantidadValida = Number.isFinite(cantidadNum) && cantidadNum > 0 ? cantidadNum : 0
  const stockActual = selectedSucursalId ? getStockForSucursal(stocksSucursales, selectedSucursalId) : 0
  const stockFinal = tipoMovimiento === "ENTRADA" ? stockActual + cantidadValida : stockActual - cantidadValida
  const isInsuficiente = tipoMovimiento === "SALIDA" && cantidadValida > 0 && stockFinal < 0
  const isValid =
    variante?.variantId !== null &&
    variante?.variantId !== undefined &&
    selectedSucursalId !== null &&
    cantidadValida > 0 &&
    !isInsuficiente

  const handleSubmit = useCallback(async () => {
    if (!isValid || !variante?.variantId || !selectedSucursalId) return

    setIsSaving(true)
    try {
      const response = await authFetch("/api/sucursal-stock/movimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idSucursal: selectedSucursalId,
          idProductoVariante: variante.variantId,
          tipoMovimiento,
          cantidad: cantidadValida,
          motivo: motivo.trim() || undefined,
        }),
      })
      const data = await parseJsonSafe(response)

      if (!response.ok) {
        toast.error(typeof data?.message === "string" ? data.message : "Error al registrar movimiento")
        return
      }

      toast.success(`Movimiento de ${tipoMovimiento === "ENTRADA" ? "entrada" : "salida"} registrado`)
      onOpenChange(false)
      onSuccess?.({
        idSucursal: selectedSucursalId,
        nombreSucursal: selectedStockName,
        tipoMovimiento,
        cantidad: cantidadValida,
      })
    } catch {
      toast.error("Error inesperado al registrar movimiento")
    } finally {
      setIsSaving(false)
    }
  }, [
    cantidadValida,
    isValid,
    motivo,
    onOpenChange,
    onSuccess,
    selectedStockName,
    selectedSucursalId,
    tipoMovimiento,
    variante?.variantId,
  ])

  const isEntrada = tipoMovimiento === "ENTRADA"

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isEntrada ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"
            }`}>
              {isEntrada ? (
                <ArrowDownTrayIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowUpTrayIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>
            Agregar movimiento
          </DialogTitle>
          <DialogDescription>
            Registra una entrada o salida para esta variante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
              {variante?.imageUrl ? (
                <Image
                  src={variante.imageUrl}
                  alt={variante.productName ?? "Producto"}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <CubeIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{variante?.productName ?? "Producto"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {variante?.colorName ?? ""} / {variante?.tallaName ?? ""}
                {variante?.sku ? ` - ${variante.sku}` : ""}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Tipo de movimiento</label>
            <MovimientoTipoSelector
              value={tipoMovimiento}
              onChange={(value) => {
                setTipoMovimiento(value)
                setCantidad("")
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground">Sucursal</label>
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : sucursales.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay sucursales disponibles.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {sucursales.map((sucursal) => (
                  <SucursalMiniCard
                    key={sucursal.idSucursal}
                    sucursal={sucursal}
                    selected={selectedSucursalId === sucursal.idSucursal}
                    onSelect={() => setSelectedSucursalId(sucursal.idSucursal)}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedSucursalId !== null && (
            <div className={`rounded-xl border-2 p-3 ${
              isInsuficiente
                ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10"
                : isEntrada
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10"
                  : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10"
            }`}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Impacto en stock
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Actual</p>
                  <p className="text-xl font-bold tabular-nums">{stockActual}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isInsuficiente
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : isEntrada
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}>
                    {cantidadValida > 0 ? `${isEntrada ? "+" : "-"}${cantidadValida}` : "-"}
                  </div>
                  <div className="h-px w-8 bg-border" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Final</p>
                  <p className={`text-xl font-bold tabular-nums ${
                    isInsuficiente ? "text-red-600 dark:text-red-400" : cantidadValida > 0 && isEntrada ? "text-emerald-600 dark:text-emerald-400" : cantidadValida > 0 ? "text-orange-600 dark:text-orange-400" : ""
                  }`}>
                    {cantidadValida > 0 ? stockFinal : "-"}
                  </p>
                </div>
              </div>
              {isInsuficiente && (
                <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Stock insuficiente. Disponible: {stockActual}, solicitado: {cantidadValida}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={cantidad}
                onChange={(event) => setCantidad(event.target.value)}
                placeholder="Ej. 10"
                className={`w-full rounded-lg border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isInsuficiente ? "border-red-400" : ""}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                Motivo <span className="text-muted-foreground">(opcional)</span>
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(event) => setMotivo(event.target.value.slice(0, 150))}
                placeholder={isEntrada ? "Ej. Ingreso por compra" : "Ej. Merma de producto"}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-right text-[10px] text-muted-foreground">{motivo.length}/150</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSaving}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isEntrada ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Registrando...
                </>
              ) : (
                <>
                  {isEntrada ? <ArrowDownTrayIcon className="h-3.5 w-3.5" /> : <ArrowUpTrayIcon className="h-3.5 w-3.5" />}
                  Registrar {isEntrada ? "Entrada" : "Salida"}
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
