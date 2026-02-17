import { memo } from "react"
import {
  PencilSquareIcon,
  SwatchIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

import { ColoresTableSkeleton } from "@/components/colores/ColoresTableSkeleton"
import { toPickerColor } from "@/components/colores/colores.utils"
import type { Color } from "@/lib/types/color"

interface ColoresTableProps {
  colores: Color[]
  loading: boolean
  onEditColor: (color: Color) => void
  onDeleteColor: (color: Color) => void
}

function ColoresTableComponent({
  colores,
  loading,
  onEditColor,
  onDeleteColor,
}: ColoresTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Color
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Muestra
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Hexadecimal
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Estado
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <ColoresTableSkeleton />
          ) : colores.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                No se encontraron colores
              </td>
            </tr>
          ) : (
            colores.map((color) => (
              <tr
                key={color.idColor}
                className="border-b transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <SwatchIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">{color.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block h-7 w-7 rounded-full border-2 border-muted shadow-sm"
                    style={{ backgroundColor: toPickerColor(color.codigo) }}
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {color.codigo}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      color.estado === "ACTIVO"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {color.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Editar"
                      onClick={() => onEditColor(color)}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                      title="Eliminar"
                      onClick={() => onDeleteColor(color)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export const ColoresTable = memo(ColoresTableComponent)
