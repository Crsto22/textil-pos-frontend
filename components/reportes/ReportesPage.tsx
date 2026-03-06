"use client"

import { useState } from "react"
import { ArrowDownTrayIcon, CalendarDaysIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"

import { useVentaReporteExcel } from "@/lib/hooks/useVentaReporteExcel"
import type { VentaListadoPeriodoBase } from "@/lib/types/venta"

function getTodayDateValue(): string {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

const TODAY_DATE = getTodayDateValue()

const PERIOD_OPTIONS: Array<{ value: VentaListadoPeriodoBase; label: string }> = [
  { value: "HOY", label: "Hoy" },
  { value: "AYER", label: "Ayer" },
  { value: "SEMANA", label: "Semana actual" },
  { value: "MES", label: "Mes actual" },
  { value: "FECHA", label: "Fecha especifica" },
]

const EXCEL_SHEETS = [
  "Resumen",
  "Detalle Ventas",
  "Items Venta",
  "Pagos Venta",
  "Resumen Clientes",
]

export function ReportesPage() {
  const [periodo, setPeriodo] = useState<VentaListadoPeriodoBase>("HOY")
  const [usarRangoFechas, setUsarRangoFechas] = useState(false)
  const [fecha, setFecha] = useState(TODAY_DATE)
  const [fechaDesde, setFechaDesde] = useState(TODAY_DATE)
  const [fechaHasta, setFechaHasta] = useState(TODAY_DATE)

  const { isExporting, exportReporteExcel } = useVentaReporteExcel()

  const handleDownloadExcel = async () => {
    if (usarRangoFechas) {
      if (!fechaDesde || !fechaHasta) {
        toast.error("Selecciona fecha desde y hasta")
        return
      }
      if (fechaDesde > fechaHasta) {
        toast.error("La fecha desde no puede ser mayor a la fecha hasta")
        return
      }

      await exportReporteExcel({
        periodo: "RANGO",
        desde: fechaDesde,
        hasta: fechaHasta,
      })
      return
    }

    if (periodo === "FECHA") {
      if (!fecha) {
        toast.error("Selecciona una fecha")
        return
      }

      await exportReporteExcel({
        periodo: "RANGO",
        desde: fecha,
      })
      return
    }

    await exportReporteExcel({ periodo })
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Reportes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Descarga el reporte de ventas en Excel con los filtros requeridos.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-[oklch(0.3_0_0)] dark:bg-[oklch(0.15_0_0)] dark:text-slate-300">
          <ClipboardDocumentListIcon className="h-4 w-4" />
          Reporte Excel de ventas
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[oklch(0.3_0_0)] dark:bg-[oklch(0.15_0_0)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-muted-foreground" htmlFor="periodo-reporte-excel">
              Periodo
            </label>
            <select
              id="periodo-reporte-excel"
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value as VentaListadoPeriodoBase)}
              disabled={usarRangoFechas}
              className="h-9 rounded-lg border bg-background px-3 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={usarRangoFechas}
                onChange={(event) => setUsarRangoFechas(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              Usar rango de fechas
            </label>

            {usarRangoFechas ? (
              <>
                <label className="text-xs text-muted-foreground" htmlFor="reporte-desde">
                  Desde
                </label>
                <input
                  id="reporte-desde"
                  type="date"
                  value={fechaDesde}
                  onChange={(event) => setFechaDesde(event.target.value)}
                  className="h-9 rounded-lg border bg-background px-3 text-xs outline-none"
                />
                <label className="text-xs text-muted-foreground" htmlFor="reporte-hasta">
                  Hasta
                </label>
                <input
                  id="reporte-hasta"
                  type="date"
                  value={fechaHasta}
                  onChange={(event) => setFechaHasta(event.target.value)}
                  className="h-9 rounded-lg border bg-background px-3 text-xs outline-none"
                />
              </>
            ) : periodo === "FECHA" ? (
              <>
                <label className="text-xs text-muted-foreground" htmlFor="reporte-fecha">
                  Fecha
                </label>
                <input
                  id="reporte-fecha"
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  className="h-9 rounded-lg border bg-background px-3 text-xs outline-none"
                />
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                El periodo seleccionado se aplica automaticamente
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CalendarDaysIcon className="h-4 w-4" />
              Endpoint: /api/venta/reporte/excel
            </div>

            <button
              type="button"
              onClick={() => {
                void handleDownloadExcel()
              }}
              disabled={isExporting}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#3266E4] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2756ca] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {isExporting ? "Descargando..." : "Descargar Excel"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[oklch(0.3_0_0)] dark:bg-[oklch(0.15_0_0)]">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Hojas incluidas en el Excel
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {EXCEL_SHEETS.map((sheet) => (
            <div
              key={sheet}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-[oklch(0.3_0_0)] dark:bg-[oklch(0.18_0_0)] dark:text-slate-200"
            >
              {sheet}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
