import { memo } from "react"
import {
  PencilSquareIcon,
  RectangleStackIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { CategoriasTableSkeleton } from "@/components/categorias/CategoriasTableSkeleton"
import { formatFechaRegistro } from "@/components/categorias/categorias.utils"
import type { Categoria } from "@/lib/types/categoria"

interface CategoriasTableProps {
  categorias: Categoria[]
  loading: boolean
  onEditCategoria: (categoria: Categoria) => void
  onDeleteCategoria: (categoria: Categoria) => void
}

function CategoriasTableComponent({
  categorias,
  loading,
  onEditCategoria,
  onDeleteCategoria,
}: CategoriasTableProps) {
  if (loading) return <CategoriasTableSkeleton />

  if (categorias.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border bg-card">
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">No se encontraron categorias</p>
      </div>
    )
  }

  return (
    <>
      {/* ─── MOBILE cards ─── */}
      <div className="grid grid-cols-1 gap-2 sm:hidden">
        {categorias.map((categoria) => (
          <article key={categoria.idCategoria} className="rounded-xl border bg-card px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <RectangleStackIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm">{categoria.nombreCategoria}</p>
                {categoria.descripcion && (
                  <p className="truncate text-[11px] text-muted-foreground">{categoria.descripcion}</p>
                )}
                <p className="text-[11px] text-muted-foreground">{formatFechaRegistro(categoria.fechaRegistro)}</p>
              </div>
              <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                categoria.estado === "ACTIVO"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {categoria.estado === "ACTIVO" ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 border-t pt-2">
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Editar" onClick={() => onEditCategoria(categoria)}>
                <PencilSquareIcon className="h-4 w-4" />
              </button>
              <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30" title="Eliminar" onClick={() => onDeleteCategoria(categoria)}>
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* ─── DESKTOP table ─── */}
      <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</th>
                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">Descripcion</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.idCategoria} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold text-muted-foreground">{categoria.idCategoria}</td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <RectangleStackIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-medium">{categoria.nombreCategoria}</span>
                        <p className="truncate text-xs text-muted-foreground lg:hidden">{categoria.descripcion || "Sin descripcion"}</p>
                        <p className="text-xs text-muted-foreground">{formatFechaRegistro(categoria.fechaRegistro)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{categoria.descripcion || "Sin descripcion"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      categoria.estado === "ACTIVO"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {categoria.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Editar" onClick={() => onEditCategoria(categoria)}>
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30" title="Eliminar" onClick={() => onDeleteCategoria(categoria)}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export const CategoriasTable = memo(CategoriasTableComponent)
