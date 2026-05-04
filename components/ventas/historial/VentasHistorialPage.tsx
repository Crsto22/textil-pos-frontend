"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { AnularVentaDialog } from "@/components/ventas/historial/AnularVentaDialog"
import { VentasHistorialFilters } from "@/components/ventas/historial/VentasHistorialFilters"
import { VentasHistorialTable } from "@/components/ventas/historial/VentasHistorialTable"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
import { useVentaReporteExcel } from "@/lib/hooks/useVentaReporteExcel"
import { useVentaReportePdf } from "@/lib/hooks/useVentaReportePdf"
import { useVentasHistorial } from "@/lib/hooks/useVentasHistorial"
import {
  downloadVentaDocument,
  getVentaDownloadConfig,
  openVentaDocument,
} from "@/lib/venta-documents"
import type {
  VentaAnularRequest,
  VentaAnularResult,
  VentaBajaInfo,
  VentaHistorial,
  VentaHistorialFilters,
} from "@/lib/types/venta"

function getTodayDateValue(): string {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

const TODAY_DATE = getTodayDateValue()

const DEFAULT_FILTERS: VentaHistorialFilters = {
  search: "",
  estado: "TODOS",
  comprobante: "TODOS",
  idUsuario: null,
  idSucursal: null,
  idCanalVenta: null,
  idCliente: null,
  periodo: "HOY",
  usarRangoFechas: false,
  fecha: TODAY_DATE,
  fechaDesde: TODAY_DATE,
  fechaHasta: TODAY_DATE,
}

interface VentasHistorialPageProps {
  /** Cuando se pasa, la consulta y los filtros se restringen a esos tipos de comprobante. */
  lockedTipos?: string[]
  /** Oculta la columna SUNAT y el panel SUNAT en el menú de acciones. */
  hideSunat?: boolean
  /** Muestra el botón "Reporte Envios PDF" en los filtros. */
  showReportePdf?: boolean
}

export function VentasHistorialPage({ lockedTipos, hideSunat = false, showReportePdf = false }: VentasHistorialPageProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [filters, setFilters] = useState<VentaHistorialFilters>(() => ({
    ...DEFAULT_FILTERS,
    idSucursal: user?.idSucursal ?? null,
  }))
  const [openingPdfVentaId, setOpeningPdfVentaId] = useState<number | null>(null)
  const [downloadingPdfVentaId, setDownloadingPdfVentaId] = useState<number | null>(null)
  const [openingTicketVentaId, setOpeningTicketVentaId] = useState<number | null>(null)
  const [downloadingXmlVentaId, setDownloadingXmlVentaId] = useState<number | null>(null)
  const [downloadingCdrVentaId, setDownloadingCdrVentaId] = useState<number | null>(null)
  const [downloadingBajaXmlVentaId, setDownloadingBajaXmlVentaId] = useState<number | null>(null)
  const [downloadingBajaCdrVentaId, setDownloadingBajaCdrVentaId] = useState<number | null>(null)
  const [darDeBajaVentaInfo, setDarDeBajaVentaInfo] = useState<VentaBajaInfo | null>(null)
  const [darDeBajaDialogOpen, setDarDeBajaDialogOpen] = useState(false)
  const [enviandoBaja, setEnviandoBaja] = useState(false)
  const {
    ventas,
    page,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setDisplayedPage,
    refreshVentas,
  } = useVentasHistorial(filters, lockedTipos)
  const { isExporting, exportReporteExcel } = useVentaReporteExcel()
  const { isExporting: isExportingPdf, exportReportePdf } = useVentaReportePdf()

  useEffect(() => {
    const ventaIdParam = searchParams.get("ventaId")
    if (!ventaIdParam) return

    const ventaId = Number(ventaIdParam)
    if (!Number.isFinite(ventaId) || ventaId <= 0) {
      router.replace("/ventas/historial", { scroll: false })
      return
    }

    router.replace(`/ventas/historial/${ventaId}`, { scroll: false })
  }, [router, searchParams])

  const estadoOptions = useMemo(() => {
    const values = new Set<string>()
    ventas.forEach((venta) => {
      if (venta.estado?.trim()) values.add(venta.estado.trim().toUpperCase())
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [ventas])

  const filteredVentas = useMemo(() => {
    if (filters.estado === "TODOS") return ventas
    return ventas.filter(
      (venta) => venta.estado.trim().toUpperCase() === filters.estado.trim().toUpperCase()
    )
  }, [filters.estado, ventas])

  const reporteTiposComprobante = useMemo(() => {
    if (lockedTipos && lockedTipos.length > 0) {
      return filters.comprobante !== "TODOS" ? [filters.comprobante] : lockedTipos
    }

    return filters.comprobante !== "TODOS" ? [filters.comprobante] : undefined
  }, [filters.comprobante, lockedTipos])

  const handleFiltersChange = (next: VentaHistorialFilters) => {
    setFilters(next)
  }

  const handleClearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS, idSucursal: user?.idSucursal ?? null })
  }

  const handleDownloadReport = async () => {
    if (filters.usarRangoFechas) {
      if (!filters.fechaDesde || !filters.fechaHasta) {
        toast.error("Selecciona fecha desde y hasta")
        return
      }
      if (filters.fechaDesde > filters.fechaHasta) {
        toast.error("La fecha desde no puede ser mayor a la fecha hasta")
        return
      }

      await exportReporteExcel({
        periodo: "RANGO",
        desde: filters.fechaDesde,
        hasta: filters.fechaHasta,
        idSucursal: filters.idSucursal,
        idCliente: filters.idCliente,
        tiposComprobante: reporteTiposComprobante,
      })
      return
    }

    if (filters.periodo === "FECHA") {
      if (!filters.fecha) {
        toast.error("Selecciona una fecha")
        return
      }

      await exportReporteExcel({
        periodo: "RANGO",
        desde: filters.fecha,
        hasta: filters.fecha,
        idSucursal: filters.idSucursal,
        idCliente: filters.idCliente,
        tiposComprobante: reporteTiposComprobante,
      })
      return
    }

    await exportReporteExcel({
      periodo: filters.periodo,
      idSucursal: filters.idSucursal,
      idCliente: filters.idCliente,
      tiposComprobante: reporteTiposComprobante,
    })
  }

  const handleDownloadReportPdf = async () => {
    if (filters.usarRangoFechas) {
      if (!filters.fechaDesde || !filters.fechaHasta) {
        toast.error("Selecciona fecha desde y hasta")
        return
      }
      if (filters.fechaDesde > filters.fechaHasta) {
        toast.error("La fecha desde no puede ser mayor a la fecha hasta")
        return
      }

      await exportReportePdf({
        periodo: "RANGO",
        desde: filters.fechaDesde,
        hasta: filters.fechaHasta,
        idUsuario: filters.idUsuario,
        idSucursal: filters.idSucursal,
        idCliente: filters.idCliente,
        tiposComprobante: reporteTiposComprobante,
        incluirAnuladas: filters.estado !== "TODOS" ? undefined : undefined,
      })
      return
    }

    if (filters.periodo === "FECHA") {
      if (!filters.fecha) {
        toast.error("Selecciona una fecha")
        return
      }

      await exportReportePdf({
        periodo: "RANGO",
        desde: filters.fecha,
        hasta: filters.fecha,
        idUsuario: filters.idUsuario,
        idSucursal: filters.idSucursal,
        idCliente: filters.idCliente,
        tiposComprobante: reporteTiposComprobante,
      })
      return
    }

    await exportReportePdf({
      periodo: filters.periodo,
      idUsuario: filters.idUsuario,
      idSucursal: filters.idSucursal,
      idCliente: filters.idCliente,
      tiposComprobante: reporteTiposComprobante,
    })
  }

  const handleOpenPdf = async (ventaId: number) => {
    setOpeningPdfVentaId(ventaId)
    const result = await openVentaDocument(getVentaDownloadConfig("comprobante", { idVenta: ventaId }))

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setOpeningPdfVentaId((current) => (current === ventaId ? null : current))
  }

  const handleDownloadPdf = async (ventaId: number) => {
    setDownloadingPdfVentaId(ventaId)

    const config = getVentaDownloadConfig("comprobante", { idVenta: ventaId })
    const result = await downloadVentaDocument({
      ...config,
      disposition: "download",
      successMessage: "Comprobante descargado correctamente.",
    })

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setDownloadingPdfVentaId((current) => (current === ventaId ? null : current))
  }

  const handleOpenTicket = async (ventaId: number) => {
    setOpeningTicketVentaId(ventaId)
    const result = await openVentaDocument(getVentaDownloadConfig("ticket", { idVenta: ventaId }))

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setOpeningTicketVentaId((current) => (current === ventaId ? null : current))
  }

  const handleDownloadXml = async (ventaId: number) => {
    setDownloadingXmlVentaId(ventaId)
    const result = await downloadVentaDocument(getVentaDownloadConfig("xml", { idVenta: ventaId }))

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setDownloadingXmlVentaId((current) => (current === ventaId ? null : current))
  }

  const handleDarDeBaja = (venta: VentaHistorial) => {
    setDarDeBajaVentaInfo({
      idVenta: venta.idVenta,
      tipoComprobante: venta.tipoComprobante,
      serie: venta.serie,
      correlativo: venta.correlativo,
      nombreCliente: venta.nombreCliente,
      moneda: venta.moneda,
      total: venta.total,
    })
    setDarDeBajaDialogOpen(true)
  }

  const handleConfirmDarDeBaja = async (payload: VentaAnularRequest): Promise<VentaAnularResult> => {
    if (!darDeBajaVentaInfo) {
      return { ok: false, message: "No hay venta seleccionada", response: null }
    }
    setEnviandoBaja(true)
    try {
      const response = await authFetch(`/api/venta/${darDeBajaVentaInfo.idVenta}/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          (typeof data?.message === "string" && data.message) ||
          "No se pudo enviar la solicitud de baja"
        return { ok: false, message, response: null }
      }
      void refreshVentas()
      return {
        ok: true,
        message:
          (typeof data?.message === "string" && data.message) ||
          "Solicitud de baja registrada correctamente",
        response: null,
      }
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Error al dar de baja",
        response: null,
      }
    } finally {
      setEnviandoBaja(false)
    }
  }

  const handleDownloadCdr = async (ventaId: number) => {
    setDownloadingCdrVentaId(ventaId)
    const result = await downloadVentaDocument(getVentaDownloadConfig("cdr-zip", { idVenta: ventaId }))

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setDownloadingCdrVentaId((current) => (current === ventaId ? null : current))
  }

  const handleDownloadBajaXml = async (ventaId: number) => {
    setDownloadingBajaXmlVentaId(ventaId)
    const result = await downloadVentaDocument(getVentaDownloadConfig("baja-xml", { idVenta: ventaId }))

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setDownloadingBajaXmlVentaId((current) => (current === ventaId ? null : current))
  }

  const handleDownloadBajaCdr = async (ventaId: number) => {
    setDownloadingBajaCdrVentaId(ventaId)
    const result = await downloadVentaDocument(getVentaDownloadConfig("baja-cdr", { idVenta: ventaId }))

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setDownloadingBajaCdrVentaId((current) => (current === ventaId ? null : current))
  }

  return (
    <div className="space-y-4">
      <VentasHistorialFilters
        filters={filters}
        estadoOptions={estadoOptions}
        totalShown={filteredVentas.length}
        pageElements={numberOfElements}
        totalElements={totalElements}
        reportLoading={isExporting}
        reportPdfLoading={isExportingPdf}
        lockedTipos={lockedTipos}
        showReportePdf={showReportePdf}
        loading={loading}
        onChange={handleFiltersChange}
        onDownloadReport={() => {
          void handleDownloadReport()
        }}
        onDownloadReportPdf={() => {
          void handleDownloadReportPdf()
        }}
        onClear={handleClearFilters}
        onRefresh={() => {
          void refreshVentas()
        }}
      />

      <VentasHistorialTable
        ventas={filteredVentas}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        hideSunat={hideSunat}
        onRetry={() => {
          void refreshVentas()
        }}
        onPageChange={setDisplayedPage}
        onViewDetail={(venta) => {
          router.push(`/ventas/historial/${venta.idVenta}`)
        }}
        onOpenPdf={(venta) => {
          void handleOpenPdf(venta.idVenta)
        }}
        onDownloadPdf={(venta) => {
          void handleDownloadPdf(venta.idVenta)
        }}
        onOpenTicket={(venta) => {
          void handleOpenTicket(venta.idVenta)
        }}
        onGenerarNotaCredito={(venta) => {
          router.push(`/ventas/nota-credito/nueva?idVenta=${venta.idVenta}`)
        }}
        onDarDeBaja={handleDarDeBaja}
        onDownloadXml={(venta) => {
          void handleDownloadXml(venta.idVenta)
        }}
        onDownloadCdr={(venta) => {
          void handleDownloadCdr(venta.idVenta)
        }}
        onDownloadBajaXml={(venta) => {
          void handleDownloadBajaXml(venta.idVenta)
        }}
        onDownloadBajaCdr={(venta) => {
          void handleDownloadBajaCdr(venta.idVenta)
        }}
        openingPdfVentaId={openingPdfVentaId}
        downloadingPdfVentaId={downloadingPdfVentaId}
        openingTicketVentaId={openingTicketVentaId}
        downloadingXmlVentaId={downloadingXmlVentaId}
        downloadingCdrVentaId={downloadingCdrVentaId}
        downloadingBajaXmlVentaId={downloadingBajaXmlVentaId}
        downloadingBajaCdrVentaId={downloadingBajaCdrVentaId}
      />
      <AnularVentaDialog
        open={darDeBajaDialogOpen}
        detalle={darDeBajaVentaInfo}
        isSubmitting={enviandoBaja}
        onOpenChange={(open) => {
          setDarDeBajaDialogOpen(open)
          if (!open) setDarDeBajaVentaInfo(null)
        }}
        onConfirm={handleConfirmDarDeBaja}
      />
    </div>
  )
}
