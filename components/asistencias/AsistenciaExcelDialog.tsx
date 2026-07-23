"use client"

import { useState } from "react"
import { ArrowDownTrayIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth/auth-fetch"
import { asistenciaPeriodRange, type AsistenciaPeriod } from "@/lib/asistencia-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch: string
  branches: Array<{ value: string; label: string }>
  status: string
  week: string
  weekEnd: string
  search: string
}

type ExportPeriod = AsistenciaPeriod | "SEMANA_MOSTRADA"

function dateFromIso(value: string) {
  return new Date(`${value}T12:00:00`)
}

function filename(disposition: string | null, desde: string, hasta: string) {
  const match = disposition?.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i)
  return match?.[1] ? decodeURIComponent(match[1].trim()) : `asistencia_${desde}_${hasta}.xlsx`
}

export function AsistenciaExcelDialog({ open, onOpenChange, branch, branches, status, week, weekEnd, search }: Props) {
  const [period, setPeriod] = useState<ExportPeriod>("SEMANA_MOSTRADA")
  const [exportBranch, setExportBranch] = useState(branch || "TODAS")
  const [desde, setDesde] = useState(week)
  const [hasta, setHasta] = useState(weekEnd)
  const [exporting, setExporting] = useState(false)

  function selectPeriod(value: ExportPeriod) {
    setPeriod(value)
    if (value === "SEMANA_MOSTRADA") {
      setDesde(week)
      setHasta(weekEnd)
    } else if (value !== "RANGO") {
      const range = asistenciaPeriodRange(value)
      setDesde(range.desde)
      setHasta(range.hasta)
    }
  }

  async function download() {
    const days = Math.floor((dateFromIso(hasta).getTime() - dateFromIso(desde).getTime()) / 86_400_000) + 1
    if (!desde || !hasta || days < 1 || days > 31) {
      toast.error("El rango debe contener entre 1 y 31 dias")
      return
    }

    const params = new URLSearchParams({ desde, hasta })
    if (exportBranch !== "TODAS") params.set("idSucursal", exportBranch)
    if (status !== "TODOS") params.set("estado", status)
    if (search.trim()) params.set("q", search.trim())
    setExporting(true)
    try {
      const response = await authFetch(`/api/asistencia/resumen/reporte/excel?${params}`)
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null
        toast.error(payload?.message ?? "No se pudo exportar el reporte")
        return
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename(response.headers.get("content-disposition"), desde, hasta)
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success("Reporte Excel descargado")
      onOpenChange(false)
    } catch {
      toast.error("No se pudo conectar para generar el reporte")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar asistencias</DialogTitle>
          <DialogDescription>Selecciona la sucursal y el periodo que apareceran en el archivo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sucursal</label>
            <Select value={exportBranch} onValueChange={setExportBranch}>
              <SelectTrigger className="w-full">
                <BuildingStorefrontIcon className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas las sucursales</SelectItem>
                {branches.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Periodo</label>
            <Select value={period} onValueChange={(value) => selectPeriod(value as ExportPeriod)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMANA_MOSTRADA">Semana mostrada</SelectItem>
                <SelectItem value="SEMANA_ACTUAL">Semana actual</SelectItem>
                <SelectItem value="SEMANA_ANTERIOR">Semana anterior</SelectItem>
                <SelectItem value="QUINCENA_ACTUAL">Quincena actual</SelectItem>
                <SelectItem value="QUINCENA_ANTERIOR">Quincena anterior</SelectItem>
                <SelectItem value="MES_ACTUAL">Mes actual</SelectItem>
                <SelectItem value="MES_ANTERIOR">Mes anterior</SelectItem>
                <SelectItem value="RANGO">Rango personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Desde
              <Input type="date" value={desde} onChange={(event) => { setDesde(event.target.value); setPeriod("RANGO") }} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Hasta
              <Input type="date" value={hasta} onChange={(event) => { setHasta(event.target.value); setPeriod("RANGO") }} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>Cancelar</Button>
          <Button type="button" onClick={() => void download()} disabled={exporting}>
            <ArrowDownTrayIcon />
            {exporting ? "Generando..." : "Descargar Excel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
