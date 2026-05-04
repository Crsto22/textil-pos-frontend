import { memo } from "react"
import {
  PencilSquareIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { TallasTableSkeleton } from "@/components/tallas/TallasTableSkeleton"
import type { Talla } from "@/lib/types/talla"

interface TallasTableProps {
  tallas: Talla[]
  loading: boolean
  onEditTalla: (talla: Talla) => void
  onDeleteTalla: (talla: Talla) => void
}

function TallasTableComponent({
  tallas,
  loading,
  onEditTalla,
  onDeleteTalla,
}: TallasTableProps) {
  if (loading) return <TallasTableSkeleton />

  if (tallas.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border bg-card">
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">No se encontraron tallas</p>
      </div>
    )
  }

  return (
    <>
      {/* ─── MOBILE cards ─── */}
      <div className="grid grid-cols-1 gap-2 sm:hidden">
        {tallas.map((talla) => (
          <article key={talla.idTalla} className="rounded-xl border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TagIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{talla.nombre}</p>
                <p className="text-[11px] text-muted-foreground">ID: {talla.idTalla}</p>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                talla.estado === "ACTIVO"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {talla.estado === "ACTIVO" ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 border-t pt-2">
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Editar" onClick={() => onEditTalla(talla)}>
                <PencilSquareIcon className="h-4 w-4" />
              </button>
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30" title="Eliminar" onClick={() => onDeleteTalla(talla)}>
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* ─── DESKTOP table ─── */}
      <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tallas.map((talla) => (
              <tr key={talla.idTalla} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold text-muted-foreground">{talla.idTalla}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <TagIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">{talla.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    talla.estado === "ACTIVO"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {talla.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Editar" onClick={() => onEditTalla(talla)}>
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30" title="Eliminar" onClick={() => onDeleteTalla(talla)}>
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export const TallasTable = memo(TallasTableComponent)
