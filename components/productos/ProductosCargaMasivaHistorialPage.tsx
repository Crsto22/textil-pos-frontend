"use client"

import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline"
import Link from "next/link"
import { useMemo, useState } from "react"

import { LoaderSpinner } from "@/components/ui/loader-spinner"
import { useProductoImportHistory } from "@/lib/hooks/useProductoImportHistory"
import type { ProductoImportacionHistorial } from "@/lib/types/producto"

type UploadStatus = "COMPLETADO" | "FALLIDO" | "PROCESANDO"

const STATUS_STYLES: Record<UploadStatus, string> = {
  COMPLETADO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  FALLIDO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PROCESANDO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

const STATUS_LABELS: Record<UploadStatus, string> = {
  COMPLETADO: "Completado",
  FALLIDO: "Fallido",
  PROCESANDO: "Procesando",
}

function normalizeUploadStatus(estado: string): UploadStatus {
  const value = estado.trim().toUpperCase()
  if (value === "EXITOSA" || value === "COMPLETADA" || value === "COMPLETADO") {
    return "COMPLETADO"
  }
  if (
    value === "PROCESANDO" ||
    value === "EN_PROCESO" ||
    value === "EN PROCESO" ||
    value === "PENDIENTE"
  ) {
    return "PROCESANDO"
  }
  return "FALLIDO"
}

function formatDateLabel(dateIso: string): string {
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

function formatDateFilterLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function downloadFile(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" })
  downloadFile(filename, blob)
}

export function ProductosCargaMasivaHistorialPage() {
  const {
    history,
    page,
    totalPages,
    totalElements,
    loading,
    error,
    setPage,
    refreshHistory,
  } = useProductoImportHistory()

  const [dateFilter, setDateFilter] = useState("ALL")
  const [userFilter, setUserFilter] = useState("ALL")

  const dateOptions = useMemo(() => {
    const uniqueDates = Array.from(
      new Set(
        history
          .map((item) => item.createdAt.slice(0, 10))
          .filter((d) => d !== "")
      )
    )
    return uniqueDates.sort((a, b) => b.localeCompare(a))
  }, [history])

  const userOptions = useMemo(() => {
    const uniqueUsers = Array.from(new Set(history.map((item) => item.nombreUsuario)))
    return uniqueUsers.sort((a, b) => a.localeCompare(b))
  }, [history])

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const dateKey = item.createdAt.slice(0, 10)
      const passesDate = dateFilter === "ALL" || dateFilter === dateKey
      const passesUser = userFilter === "ALL" || userFilter === item.nombreUsuario
      return passesDate && passesUser
    })
  }, [dateFilter, history, userFilter])

  const handleDownloadResult = (item: ProductoImportacionHistorial) => {
    const visualStatus = normalizeUploadStatus(item.estado)
    const summary = [
      `Archivo: ${item.nombreArchivo}`,
      `Usuario: ${item.nombreUsuario}`,
      `Sucursal: ${item.nombreSucursal}`,
      `Fecha: ${formatDateLabel(item.createdAt)}`,
      `Filas procesadas: ${item.filasProcesadas}`,
      `Productos creados: ${item.productosCreados}`,
      `Productos actualizados: ${item.productosActualizados}`,
      `Variantes guardadas: ${item.variantesGuardadas}`,
      `Categorias creadas: ${item.categoriasCreadas}`,
      `Colores creados: ${item.coloresCreados}`,
      `Tallas creadas: ${item.tallasCreadas}`,
      `Duracion (ms): ${item.duracionMs ?? "-"}`,
      `Estado: ${STATUS_LABELS[visualStatus]}`,
      `Mensaje error: ${item.mensajeError ?? "-"}`,
    ].join("\n")
    downloadTextFile(`resultado_${item.nombreArchivo}.txt`, summary)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/productos/carga-masiva"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Volver
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Historial de Importaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Registro de todas las cargas masivas realizadas
          </p>
        </div>
      </div>

      {/* Table section */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando <strong>{filteredHistory.length}</strong> registro(s) de{" "}
            <strong>{totalElements}</strong> en esta página
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 rounded-lg border bg-background pl-9 pr-8 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Filtrar por Fecha</option>
                {dateOptions.map((dateKey) => (
                  <option key={dateKey} value={dateKey}>
                    {formatDateFilterLabel(dateKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className="relative">
              <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="h-10 rounded-lg border bg-background pl-9 pr-8 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Filtrar por Usuario</option>
                {userOptions.map((userName) => (
                  <option key={userName} value={userName}>
                    {userName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Archivo</th>
                <th className="px-4 py-3 font-semibold">Registros</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <LoaderSpinner text="Cargando historial..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-red-600 dark:text-red-400"
                  >
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={() => void refreshHistory()}
                      className="mt-2 rounded-md border border-red-300 px-2 py-1 text-xs transition-colors hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No se encontraron registros con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const visualStatus = normalizeUploadStatus(item.estado)
                  return (
                    <tr
                      key={item.idImportacion}
                      className="border-b text-foreground transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        {formatDateLabel(item.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex flex-col">
                          <span>{item.nombreUsuario}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.nombreSucursal}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <DocumentTextIcon className="h-4 w-4" />
                          {item.nombreArchivo}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        <div className="flex flex-col">
                          <span>{item.filasProcesadas} filas</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.variantesGuardadas} variantes
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[visualStatus]}`}
                        >
                          {STATUS_LABELS[visualStatus]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadResult(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Descargar detalle de ${item.nombreArchivo}`}
                          title="Descargar detalle"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={loading || page <= 0}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
            Anterior
          </button>
          <span className="font-medium">
            Página {totalPages > 0 ? page + 1 : 0} de {Math.max(totalPages, 0)}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={loading || page + 1 >= totalPages}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </div>
  )
}
