import { memo } from "react"
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline"

import { DIA_LABEL, type DiaSemana } from "@/lib/types/turno"
import type { Turno } from "@/lib/types/turno"

interface TurnosTableProps {
  turnos: Turno[]
  loading: boolean
  onEditTurno: (turno: Turno) => void
  onDeleteTurno: (turno: Turno) => void
}

function TurnosTableComponent({
  turnos,
  loading,
  onEditTurno,
  onDeleteTurno,
}: TurnosTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Horario
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Días
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estado
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="px-4 py-4" colSpan={6}>
                    <div className="h-10 animate-pulse rounded-lg bg-muted/60" />
                  </td>
                </tr>
              ))
            ) : turnos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No se encontraron turnos
                </td>
              </tr>
            ) : (
              turnos.map((turno) => (
                <tr key={turno.idTurno} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{turno.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {turno.horaInicio} – {turno.horaFin}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(turno.dias) && turno.dias.length > 0 ? (
                        turno.dias.map((dia) => (
                          <span
                            key={dia}
                            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                          >
                            {DIA_LABEL[dia as DiaSemana] ?? dia.slice(0, 3)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        turno.estado === "ACTIVO"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300"
                      }`}
                    >
                      {turno.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTurno(turno)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                        title="Editar turno"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTurno(turno)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        title="Eliminar turno"
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
    </div>
  )
}

export const TurnosTable = memo(TurnosTableComponent)
