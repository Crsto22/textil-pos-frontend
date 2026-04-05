"use client"

import Link from "next/link"
import {
  ArrowsRightLeftIcon,
  ClockIcon,
  PlusIcon,
} from "@heroicons/react/24/outline"

import { PaginationResponsive } from "@/components/ui/pagination-responsive"
import { useTraslados } from "@/lib/hooks/useTraslados"
import type { Traslado } from "@/lib/types/traslado"

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

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <tr key={i} className="border-b last:border-0">
          <td className="px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </td>
          <td className="hidden px-4 py-3 md:table-cell">
            <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-14 animate-pulse rounded bg-muted" />
          </td>
          <td className="hidden px-4 py-3 lg:table-cell">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </td>
          <td className="hidden px-4 py-3 sm:table-cell">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </td>
        </tr>
      ))}
    </>
  )
}

function TraspasoRow({ traslado }: { traslado: Traslado }) {
  return (
    <tr className="border-b transition-colors last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
          {formatFecha(traslado.fecha)}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
          <span className="max-w-55 truncate sm:max-w-none">
            {traslado.nombreSucursalOrigen} {"->"} {traslado.nombreSucursalDestino}
          </span>
        </div>
      </td>

      <td className="hidden px-4 py-3 md:table-cell">
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {traslado.producto}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {traslado.color} / {traslado.talla}
            {traslado.sku ? ` - ${traslado.sku}` : ""}
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="text-sm font-semibold">{traslado.cantidad}</span>
      </td>

      <td className="hidden px-4 py-3 lg:table-cell">
        <span className="truncate text-sm text-muted-foreground">
          {traslado.motivo || "-"}
        </span>
      </td>

      <td className="hidden px-4 py-3 sm:table-cell">
        <span className="text-xs text-muted-foreground">
          {traslado.nombreUsuario}
        </span>
      </td>
    </tr>
  )
}

export default function TraspasosPage() {
  const { traslados, page, totalPages, totalElements, loading, setPage } =
    useTraslados()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Traspasos de Stock
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Historial de traspasos entre sucursales.
          </p>
        </div>

        <Link
          href="/stock/traspasos/nuevo"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500"
        >
          <PlusIcon className="h-4 w-4" />
          Anadir traspaso
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
                  Ruta
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground md:table-cell">
                  Producto / Variante
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cantidad
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Motivo
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground sm:table-cell">
                  Usuario
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : traslados.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No se encontraron traspasos
                  </td>
                </tr>
              ) : (
                traslados.map((traslado) => (
                  <TraspasoRow key={traslado.idTraslado} traslado={traslado} />
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
        itemLabel="traspasos"
      />
    </div>
  )
}
