import { memo } from "react"
import {
  DocumentTextIcon,
  PencilSquareIcon,
  PowerIcon,
} from "@heroicons/react/24/outline"

import { ComprobantesTableSkeleton } from "@/components/comprobantes/ComprobantesTableSkeleton"
import { formatComprobanteTipoLabel } from "@/lib/comprobante"
import type { ComprobanteConfig } from "@/lib/types/comprobante"

interface ComprobantesTableProps {
  comprobantes: ComprobanteConfig[]
  loading: boolean
  canManage: boolean
  onEditComprobante: (comprobante: ComprobanteConfig) => void
  onToggleActivo: (comprobante: ComprobanteConfig) => void
  togglingId: number | null
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
  onToggleActivo,
  togglingId,
}: ComprobantesTableProps) {
  const colSpan = canManage ? 6 : 5

  if (loading) {
    return <ComprobantesTableSkeleton canManage={canManage} />
  }

  if (comprobantes.length === 0) {
    return (
      <div className="rounded-xl border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
        No se encontraron configuraciones
      </div>
    )
  }

  return (
    <>
      {/* ─── MOBILE: cards ─── */}
      <div className="flex flex-col gap-3 md:hidden">
        {comprobantes.map((comprobante) => (
          <div
            key={comprobante.idComprobante}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-sm text-foreground">
                    {formatComprobanteTipoLabel(comprobante.tipoComprobante)}
                  </p>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      comprobante.activo === "ACTIVO"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {comprobante.activo === "ACTIVO" ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Serie: <span className="font-medium text-foreground">{comprobante.serie || "Sin serie"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(comprobante.updatedAt ?? comprobante.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>
                  Correlativo actual:{" "}
                  <span className="font-semibold text-foreground">{comprobante.ultimoCorrelativo}</span>
                </span>
                <span>
                  Siguiente:{" "}
                  <span className="font-semibold text-foreground">{comprobante.siguienteCorrelativo}</span>
                </span>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleActivo(comprobante)}
                    disabled={togglingId === comprobante.idComprobante}
                    className={`rounded-lg p-1.5 transition-colors ${
                      comprobante.activo === "ACTIVO"
                        ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
                        : "text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                    } ${togglingId === comprobante.idComprobante ? "animate-pulse opacity-50" : ""}`}
                    title={comprobante.activo === "ACTIVO" ? "Desactivar" : "Activar"}
                  >
                    <PowerIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditComprobante(comprobante)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── DESKTOP: table ─── */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
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
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Serie
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Correlativos
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
              {comprobantes.map((comprobante) => (
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
                        <p className="text-xs text-muted-foreground">
                          {formatDate(comprobante.updatedAt ?? comprobante.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {comprobante.serie || "Sin serie"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="space-y-1">
                      <p>Actual: {comprobante.ultimoCorrelativo}</p>
                      <p className="text-xs">Siguiente: {comprobante.siguienteCorrelativo}</p>
                    </div>
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
                          onClick={() => onToggleActivo(comprobante)}
                          disabled={togglingId === comprobante.idComprobante}
                          className={`rounded-lg p-1.5 transition-colors ${
                            comprobante.activo === "ACTIVO"
                              ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
                              : "text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                          } ${togglingId === comprobante.idComprobante ? "animate-pulse opacity-50" : ""}`}
                          title={comprobante.activo === "ACTIVO" ? "Desactivar" : "Activar"}
                        >
                          <PowerIcon className="h-4 w-4" />
                        </button>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export const ComprobantesTable = memo(ComprobantesTableComponent)
