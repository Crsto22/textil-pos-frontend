"use client"

import { useState } from "react"
import { Store, Warehouse } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { VariantSucursalStockInput } from "@/lib/types/producto-create"
import { cn } from "@/lib/utils"

interface ProductoVariantStockEditorProps {
  sucursales: VariantSucursalStockInput[]
  values: Record<number, string>
  totalStock?: string
  disabled?: boolean
  compact?: boolean
  showTotal?: boolean
  onChange: (idSucursal: number, value: string) => void
}

type TipoTab = "VENTA" | "ALMACEN"

function getTipoBadgeClass(tipoSucursal: string) {
  return tipoSucursal === "ALMACEN"
    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-300"
    : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/25 dark:text-blue-300"
}

function formatSucursalDisplayName(nombreSucursal: string, tipoSucursal: string) {
  if (tipoSucursal !== "ALMACEN") return nombreSucursal
  return nombreSucursal.replace(/^almacen\s+/i, "Alm. ")
}

export function ProductoVariantStockEditor({
  sucursales,
  values,
  totalStock,
  disabled = false,
  compact = false,
  showTotal = false,
  onChange,
}: ProductoVariantStockEditorProps) {
  const hasVenta = sucursales.some((s) => s.tipoSucursal !== "ALMACEN")
  const hasAlmacen = sucursales.some((s) => s.tipoSucursal === "ALMACEN")
  const showToggle = hasVenta && hasAlmacen

  const [activeTab, setActiveTab] = useState<TipoTab>("VENTA")

  if (sucursales.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-3 py-3 text-xs text-muted-foreground">
        No se encontraron sucursales activas para registrar stock.
      </div>
    )
  }

  const filtered = showToggle
    ? sucursales.filter((s) =>
        activeTab === "ALMACEN" ? s.tipoSucursal === "ALMACEN" : s.tipoSucursal !== "ALMACEN"
      )
    : sucursales

  return (
    <div className="space-y-2">
      {showTotal && typeof totalStock === "string" && totalStock.trim() !== "" ? (
        <div className="flex justify-end pb-1">
          <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            Total: {totalStock}
          </span>
        </div>
      ) : null}

      {/* Toggle Ventas / Almacén */}
      {showToggle && (
        <div className={cn("flex overflow-hidden rounded-lg border", compact && "rounded-md")}>
          <button
            type="button"
            onClick={() => setActiveTab("VENTA")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 border-r py-1 text-[11px] font-semibold transition-colors",
              activeTab === "VENTA"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
            )}
          >
            <Store className="h-3.5 w-3.5" />
            Ventas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ALMACEN")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-1 text-[11px] font-semibold transition-colors",
              activeTab === "ALMACEN"
                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
            )}
          >
            <Warehouse className="h-3.5 w-3.5" />
            Almacén
          </button>
        </div>
      )}

      {/* Lista filtrada */}
      <div
        className={cn(
          "rounded-2xl border bg-slate-50/70 p-3 dark:bg-muted/20",
          compact && "rounded-xl bg-muted/20 p-2.5"
        )}
      >
        <div className="space-y-2">
          {filtered.map((sucursal, index) => {
            const isAlmacen = sucursal.tipoSucursal === "ALMACEN"
            const SucursalIcon = isAlmacen ? Warehouse : Store

            return (
              <div
                key={sucursal.idSucursal}
                className={cn(
                  "flex items-start gap-3",
                  index > 0 && "border-t border-border/70 pt-2",
                  compact && "gap-2"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SucursalIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <p
                      className={cn(
                        "truncate font-medium text-foreground",
                        compact ? "text-sm" : "text-[15px]"
                      )}
                    >
                      {formatSucursalDisplayName(sucursal.nombreSucursal, sucursal.tipoSucursal)}
                    </p>
                  </div>
                  {!showToggle && (
                    <span
                      className={cn(
                        "mt-1 inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        getTipoBadgeClass(sucursal.tipoSucursal)
                      )}
                    >
                      {sucursal.tipoSucursal}
                    </span>
                  )}
                </div>

                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={values[sucursal.idSucursal] ?? ""}
                  placeholder="0"
                  disabled={disabled}
                  onChange={(event) => onChange(sucursal.idSucursal, event.target.value)}
                  className={cn(
                    "h-8 w-20 shrink-0 rounded-lg border-white bg-white px-2 text-center shadow-none dark:border-muted dark:bg-background",
                    compact && "w-20 text-sm"
                  )}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
