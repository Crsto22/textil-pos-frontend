"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { VentaDetalleModal } from "@/components/ventas/historial/VentaDetalleModal"
import { VentasHistorialFilters } from "@/components/ventas/historial/VentasHistorialFilters"
import { VentasHistorialTable } from "@/components/ventas/historial/VentasHistorialTable"
import { useVentaReporteExcel } from "@/lib/hooks/useVentaReporteExcel"
import { useVentaDetalle } from "@/lib/hooks/useVentaDetalle"
import { useVentasHistorial } from "@/lib/hooks/useVentasHistorial"
import {
  downloadVentaDocument,
  getVentaDownloadConfig,
  openVentaDocument,
} from "@/lib/venta-documents"
import type { VentaHistorialFilters } from "@/lib/types/venta"

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
  periodo: "HOY",
  usarRangoFechas: false,
  fecha: TODAY_DATE,
  fechaDesde: TODAY_DATE,
  fechaHasta: TODAY_DATE,
}

export function VentasHistorialPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<VentaHistorialFilters>(DEFAULT_FILTERS)
  const [openingPdfVentaId, setOpeningPdfVentaId] = useState<number | null>(null)
  const [downloadingPdfVentaId, setDownloadingPdfVentaId] = useState<number | null>(null)
  const [openingTicketVentaId, setOpeningTicketVentaId] = useState<number | null>(null)
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
  } = useVentasHistorial(filters)
  const {
    open: detailOpen,
    detalle,
    loading: detailLoading,
    error: detailError,
    openVentaDetalle,
    retryVentaDetalle,
    retrySunatVenta,
    retryingSunat,
    closeVentaDetalle,
  } = useVentaDetalle()
  const { isExporting, exportReporteExcel } = useVentaReporteExcel()

  useEffect(() => {
    const ventaIdParam = searchParams.get("ventaId")
    if (!ventaIdParam) return

    const ventaId = Number(ventaIdParam)
    if (!Number.isFinite(ventaId) || ventaId <= 0) return

    void openVentaDetalle(ventaId)
    router.replace(pathname, { scroll: false })
  }, [openVentaDetalle, pathname, router, searchParams])

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

  const handleFiltersChange = (next: VentaHistorialFilters) => {
    setFilters(next)
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
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
      })
      return
    }

    await exportReporteExcel({ periodo: filters.periodo })
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

  return (
    <div className="space-y-4">
      <VentasHistorialFilters
        filters={filters}
        estadoOptions={estadoOptions}
        totalShown={filteredVentas.length}
        pageElements={numberOfElements}
        totalElements={totalElements}
        reportLoading={isExporting}
        onChange={handleFiltersChange}
        onDownloadReport={() => {
          void handleDownloadReport()
        }}
        onClear={handleClearFilters}
      />

      <VentasHistorialTable
        ventas={filteredVentas}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onRetry={() => {
          void refreshVentas()
        }}
        onPageChange={setDisplayedPage}
        onViewDetail={(venta) => {
          void openVentaDetalle(venta.idVenta)
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
        openingPdfVentaId={openingPdfVentaId}
        downloadingPdfVentaId={downloadingPdfVentaId}
        openingTicketVentaId={openingTicketVentaId}
      />

      <VentaDetalleModal
        open={detailOpen}
        detalle={detalle}
        loading={detailLoading}
        error={detailError}
        onRetry={() => {
          void retryVentaDetalle()
        }}
        onRetrySunat={async () => {
          const result = await retrySunatVenta()
          if (result.ok) {
            await refreshVentas()
          }
          return result
        }}
        retryingSunat={retryingSunat}
        onOpenChange={(open) => {
          if (!open) {
            closeVentaDetalle()
          }
        }}
      />
    </div>
  )
}
