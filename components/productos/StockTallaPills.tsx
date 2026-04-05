import type { CatalogVariantItem } from "@/lib/catalog-view"
import type {
  ProductoResumen,
  ProductoResumenTalla,
  StockSucursalVenta,
} from "@/lib/types/producto"

import { cn } from "@/lib/utils"

export interface StockSucursalColumn {
  idSucursal: number
  nombreSucursal: string
}

export interface StockPillItem {
  label: string
  stock: number
}

function appendStockSucursalColumn(
  columns: Map<number, StockSucursalColumn>,
  stockItem: StockSucursalVenta
) {
  if (
    typeof stockItem.idSucursal !== "number" ||
    stockItem.idSucursal <= 0 ||
    columns.has(stockItem.idSucursal)
  ) {
    return
  }

  columns.set(stockItem.idSucursal, {
    idSucursal: stockItem.idSucursal,
    nombreSucursal: stockItem.nombreSucursal,
  })
}

export function collectProductoStockColumns(
  productos: ProductoResumen[]
): StockSucursalColumn[] {
  const columns = new Map<number, StockSucursalColumn>()

  productos.forEach((producto) => {
    producto.colores.forEach((color) => {
      color.tallas.forEach((talla) => {
        ;(talla.stocksSucursalesVenta ?? []).forEach((stockItem) => {
          appendStockSucursalColumn(columns, stockItem)
        })
      })
    })
  })

  return Array.from(columns.values())
}

export function collectVariantStockColumns(
  variants: CatalogVariantItem[]
): StockSucursalColumn[] {
  const columns = new Map<number, StockSucursalColumn>()

  variants.forEach((variant) => {
    variant.stocksSucursalesVenta.forEach((stockItem) => {
      appendStockSucursalColumn(columns, stockItem)
    })
  })

  return Array.from(columns.values())
}

function findStockBySucursal(
  stocksSucursalesVenta: StockSucursalVenta[] | null | undefined,
  idSucursal: number
) {
  return (stocksSucursalesVenta ?? []).find(
    (stockItem) => stockItem.idSucursal === idSucursal
  )
}

export function buildProductStockPills(
  tallas: ProductoResumenTalla[],
  idSucursal: number
): StockPillItem[] {
  return tallas
    .map((talla) => {
      const stockItem = findStockBySucursal(talla.stocksSucursalesVenta, idSucursal)
      if (!stockItem) return null

      return {
        label: talla.nombre,
        stock: stockItem.stock,
      }
    })
    .filter((item): item is StockPillItem => item !== null)
}

export function buildVariantStockPills(
  variant: CatalogVariantItem,
  idSucursal: number
): StockPillItem[] {
  const stockItem = findStockBySucursal(variant.stocksSucursalesVenta, idSucursal)
  if (!stockItem) return []

  return [
    {
      label: variant.tallaName,
      stock: stockItem.stock,
    },
  ]
}

interface StockTallaPillsProps {
  items: StockPillItem[]
  emptyLabel?: string
  compact?: boolean
  className?: string
}

export function StockTallaPills({
  items,
  emptyLabel = "No hay stock ahi",
  compact = false,
  className,
}: StockTallaPillsProps) {
  if (items.length === 0) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>{emptyLabel}</span>
    )
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <span
          key={`${item.label}-${item.stock}`}
          className={cn(
            "inline-flex items-center overflow-hidden rounded-lg border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/40",
            compact && "gap-0"
          )}
        >
          <span className="bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase text-white dark:bg-slate-100 dark:text-slate-900">
            {item.label}
          </span>
          <span className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">
            {item.stock}
          </span>
        </span>
      ))}
    </div>
  )
}
