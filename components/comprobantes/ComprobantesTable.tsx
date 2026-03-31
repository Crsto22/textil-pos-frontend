import { memo } from "react"
import {
  DocumentTextIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline"

import { ComprobantesTableSkeleton } from "@/components/comprobantes/ComprobantesTableSkeleton"
import { formatComprobanteTipoLabel } from "@/lib/comprobante"
import type { ComprobanteConfig } from "@/lib/types/comprobante"

interface ComprobantesTableProps {
  comprobantes: ComprobanteConfig[]
  loading: boolean
  canManage: boolean
  onEditComprobante: (comprobante: ComprobanteConfig) => void
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed)
}

function ComprobantesTableComponent({
  comprobantes,
  loading,
  canManage,
  onEditComprobante,
}: ComprobantesTableProps) {
  const colSpan = canManage ? 7 : 6

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Comprobante
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground md:table-cell">
                Serie
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Correlativos
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground xl:table-cell">
                Sucursal
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estado
              </th>
              {canManage ? (
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Acciones
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ComprobantesTableSkeleton canManage={canManage} />
            ) : comprobantes.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground">
                  No se encontraron configuraciones
                </td>
              </tr>
            ) : (
              comprobantes.map((comprobante) => (
                <tr
                  key={comprobante.idComprobante}
                  className="border-b transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-semibold text-muted-foreground">
                    {comprobante.idComprobante}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-medium">
                          {formatComprobanteTipoLabel(comprobante.tipoComprobante)}
                        </span>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          Serie {comprobante.serie || "Sin serie"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground xl:hidden">
                          {comprobante.nombreSucursal || "Sin sucursal"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(comprobante.updatedAt ?? comprobante.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {comprobante.serie || "Sin serie"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="space-y-1">
                      <p>Actual: {comprobante.ultimoCorrelativo}</p>
                      <p className="text-xs">Siguiente: {comprobante.siguienteCorrelativo}</p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                    {comprobante.nombreSucursal || "Sin sucursal"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        comprobante.activo === "ACTIVO"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {comprobante.activo === "ACTIVO" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Editar"
                          onClick={() => onEditComprobante(comprobante)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const ComprobantesTable = memo(ComprobantesTableComponent)
