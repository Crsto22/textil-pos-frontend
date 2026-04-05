"use client"

import Link from "next/link"
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  PlusIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline"

import { PaginationResponsive } from "@/components/ui/pagination-responsive"
import { useHistorialStock } from "@/lib/hooks/useHistorialStock"
import type { HistorialStock } from "@/lib/types/historial-stock"

function formatFecha(fecha: string): string {
  try {
    const date = new Date(fecha)
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return fecha
  }
}

function getTipoMovimientoConfig(tipo: string) {
  switch (tipo) {
    case "ENTRADA":
      return {
        label: "Entrada",
        icon: ArrowDownTrayIcon,
        badgeClass:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      }
    case "SALIDA":
      return {
        label: "Salida",
        icon: ArrowUpTrayIcon,
        badgeClass:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      }
    case "VENTA":
      return {
        label: "Venta",
        icon: ArrowUpTrayIcon,
        badgeClass:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      }
    case "DEVOLUCION":
      return {
        label: "Devolucion",
        icon: ArrowDownTrayIcon,
        badgeClass:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      }
    case "AJUSTE":
      return {
        label: "Ajuste",
        icon: WrenchScrewdriverIcon,
        badgeClass:
          "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
      }
    default:
      return {
        label: tipo,
        icon: ArrowsRightLeftIcon,
        badgeClass:
          "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
      }
  }
}

function StockDiff({ anterior, nuevo }: { anterior: number; nuevo: number }) {
  const diff = nuevo - anterior
  if (diff === 0) {
    return <span className="text-xs text-muted-foreground">sin cambio</span>
  }

  return (
    <span
      className={`text-xs font-semibold ${
        diff > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      {diff > 0 ? `+${diff}` : diff}
    </span>
  )
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <tr key={i} className="border-b last:border-0">
          <td className="px-4 py-3">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          </td>
          <td className="hidden px-4 py-3 md:table-cell">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </td>
          <td className="hidden px-4 py-3 lg:table-cell">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </td>
          <td className="hidden px-4 py-3 xl:table-cell">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </td>
          <td className="hidden px-4 py-3 sm:table-cell">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </td>
        </tr>
      ))}
    </>
  )
}

function MovimientoRow({ mov }: { mov: HistorialStock }) {
  const config = getTipoMovimientoConfig(mov.tipoMovimiento)
  const Icon = config.icon

  return (
    <tr className="border-b transition-colors last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
          {formatFecha(mov.fecha)}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badgeClass}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {config.label}
        </span>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {mov.producto}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {mov.color} / {mov.talla}
            {mov.sku ? ` — ${mov.sku}` : ""}
          </span>
        </div>
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <span className="text-sm">{mov.nombreSucursal}</span>
      </td>
      <td className="hidden px-4 py-3 xl:table-cell">
        <span className="truncate text-sm text-muted-foreground">
          {mov.motivo || "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {mov.stockAnterior}
          </span>
          <span className="text-xs text-muted-foreground">→</span>
          <span className="text-sm font-semibold">{mov.stockNuevo}</span>
          <StockDiff anterior={mov.stockAnterior} nuevo={mov.stockNuevo} />
        </div>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <span className="text-xs text-muted-foreground">
          {mov.nombreUsuario}
        </span>
      </td>
    </tr>
  )
}

export default function MovimientosPage() {
  const {
    movimientos,
    page,
    totalPages,
    totalElements,
    loading,
    setPage,
  } = useHistorialStock()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Movimientos de Stock
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Historial de entradas, salidas, ajustes y otros movimientos de
            inventario.
          </p>
        </div>
        <Link
          href="/stock/movimientos/nuevo"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500"
        >
          <PlusIcon className="h-4 w-4" />
          Añadir movimiento
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground md:table-cell">
                  Producto / Variante
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Sucursal
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground xl:table-cell">
                  Motivo
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Stock
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground sm:table-cell">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : movimientos.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No se encontraron movimientos
                  </td>
                </tr>
              ) : (
                movimientos.map((mov) => (
                  <MovimientoRow key={mov.idHistorial} mov={mov} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationResponsive
        totalElements={totalElements}
        totalPages={totalPages}
        page={page}
        onPageChange={setPage}
        itemLabel="movimientos"
      />
    </div>
  )
}
