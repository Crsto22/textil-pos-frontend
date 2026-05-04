"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { CotizacionConvertirVentaDialog } from "@/components/cotizaciones/historial/CotizacionConvertirVentaDialog"
import { CotizacionDetalleModal } from "@/components/cotizaciones/historial/CotizacionDetalleModal"
import { CotizacionEstadoDialog } from "@/components/cotizaciones/historial/CotizacionEstadoDialog"
import { CotizacionesHistorialFilters } from "@/components/cotizaciones/historial/CotizacionesHistorialFilters"
import { CotizacionesHistorialTable } from "@/components/cotizaciones/historial/CotizacionesHistorialTable"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
import {
  downloadCotizacionDocument,
  getCotizacionDownloadConfig,
  openCotizacionDocument,
} from "@/lib/cotizacion-documents"
import { useCotizacionDetalle } from "@/lib/hooks/useCotizacionDetalle"
import { useCotizacionesHistorial } from "@/lib/hooks/useCotizacionesHistorial"
import {
  COTIZACION_ESTADOS,
  type CotizacionConvertirVentaResponse,
  type CotizacionHistorial,
  type CotizacionHistorialFilters,
  type CotizacionEstadoUpdateRequest,
} from "@/lib/types/cotizacion"

function getTodayDateValue(): string {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

const TODAY_DATE = getTodayDateValue()
const ESTADO_OPTIONS = [...COTIZACION_ESTADOS]

const DEFAULT_FILTERS: CotizacionHistorialFilters = {
  search: "",
  estado: "TODOS",
  idUsuario: null,
  idSucursal: null,
  periodo: "HOY",
  usarRangoFechas: false,
  fecha: TODAY_DATE,
  fechaDesde: TODAY_DATE,
  fechaHasta: TODAY_DATE,
}

export function CotizacionesHistorialPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [filters, setFilters] = useState<CotizacionHistorialFilters>(() => ({
    ...DEFAULT_FILTERS,
    idSucursal: user?.idSucursal ?? null,
  }))
  const [openingPdfCotizacionId, setOpeningPdfCotizacionId] = useState<number | null>(null)
  const [downloadingPdfCotizacionId, setDownloadingPdfCotizacionId] = useState<number | null>(null)
  const [estadoDialogOpen, setEstadoDialogOpen] = useState(false)
  const [estadoTarget, setEstadoTarget] = useState<CotizacionHistorial | null>(null)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [convertTarget, setConvertTarget] = useState<CotizacionHistorial | null>(null)
  const {
    cotizaciones,
    page,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setDisplayedPage,
    refreshCotizaciones,
  } = useCotizacionesHistorial(filters)
  const {
    open: detailOpen,
    detalle,
    loading: detailLoading,
    error: detailError,
    openCotizacionDetalle,
    retryCotizacionDetalle,
    closeCotizacionDetalle,
  } = useCotizacionDetalle()

  useEffect(() => {
    const cotizacionIdParam = searchParams.get("cotizacionId")
    if (!cotizacionIdParam) return

    const cotizacionId = Number(cotizacionIdParam)
    if (!Number.isFinite(cotizacionId) || cotizacionId <= 0) return

    void openCotizacionDetalle(cotizacionId)
    router.replace(pathname, { scroll: false })
  }, [openCotizacionDetalle, pathname, router, searchParams])

  const handleFiltersChange = (next: CotizacionHistorialFilters) => {
    setFilters(next)
  }

  const handleClearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS, idSucursal: user?.idSucursal ?? null })
  }

  const handleUpdateEstado = async (
    idCotizacion: number,
    estado: CotizacionEstadoUpdateRequest["estado"]
  ): Promise<boolean> => {
    try {
      const response = await authFetch(`/api/cotizacion/estado/${idCotizacion}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          data &&
          typeof data === "object" &&
          "message" in data &&
          typeof data.message === "string"
            ? data.message
            : `Error ${response.status} al actualizar el estado`
        toast.error(message)
        return false
      }

      toast.success("Cotizacion reactivada.")
      await refreshCotizaciones()

      if (detailOpen && detalle?.idCotizacion === idCotizacion) {
        await openCotizacionDetalle(idCotizacion)
      }

      return true
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar el estado de la cotizacion"
      toast.error(message)
      return false
    }
  }

  const handleConverted = async (payload: CotizacionConvertirVentaResponse) => {
    await refreshCotizaciones()

    if (detailOpen && detalle?.idCotizacion === payload.idCotizacion) {
      await openCotizacionDetalle(payload.idCotizacion)
    }
  }

  const handleOpenPdf = async (idCotizacion: number) => {
    setOpeningPdfCotizacionId(idCotizacion)
    const result = await openCotizacionDocument(getCotizacionDownloadConfig(idCotizacion))

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setOpeningPdfCotizacionId((current) => (current === idCotizacion ? null : current))
  }

  const handleDownloadPdf = async (idCotizacion: number) => {
    setDownloadingPdfCotizacionId(idCotizacion)

    const config = getCotizacionDownloadConfig(idCotizacion)
    const result = await downloadCotizacionDocument({
      ...config,
      disposition: "download",
      successMessage: "Comprobante de cotizacion descargado correctamente.",
    })

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setDownloadingPdfCotizacionId((current) => (current === idCotizacion ? null : current))
  }

  return (
    <div className="space-y-4">
      <CotizacionesHistorialFilters
        filters={filters}
        estadoOptions={ESTADO_OPTIONS}
        totalShown={cotizaciones.length}
        pageElements={numberOfElements}
        totalElements={totalElements}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      <CotizacionesHistorialTable
        cotizaciones={cotizaciones}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onRetry={() => {
          void refreshCotizaciones()
        }}
        onPageChange={setDisplayedPage}
        onViewDetail={(cotizacion) => {
          void openCotizacionDetalle(cotizacion.idCotizacion)
        }}
        onOpenPdf={(cotizacion) => {
          void handleOpenPdf(cotizacion.idCotizacion)
        }}
        onDownloadPdf={(cotizacion) => {
          void handleDownloadPdf(cotizacion.idCotizacion)
        }}
        onEdit={(cotizacion) => {
          if (cotizacion.estado.trim().toUpperCase() !== "ACTIVA") {
            toast.error("Solo las cotizaciones activas se pueden editar.")
            return
          }

          router.push(`/ventas/cotizacion/${cotizacion.idCotizacion}/editar`)
        }}
        onChangeStatus={(cotizacion) => {
          const normalizedEstado = cotizacion.estado.trim().toUpperCase()
          if (normalizedEstado === "CONVERTIDA") {
            toast.error("La cotizacion convertida no puede reactivarse.")
            return
          }
          if (normalizedEstado === "ACTIVA") {
            toast.error("La cotizacion ya se encuentra activa.")
            return
          }

          setEstadoTarget(cotizacion)
          setEstadoDialogOpen(true)
        }}
        onConvert={(cotizacion) => {
          const normalizedEstado = cotizacion.estado.trim().toUpperCase()
          if (normalizedEstado !== "ACTIVA") {
            toast.error(
              normalizedEstado === "CONVERTIDA"
                ? "La cotizacion ya fue convertida a venta."
                : "Solo las cotizaciones activas se pueden convertir a venta."
            )
            return
          }

          setConvertTarget(cotizacion)
          setConvertDialogOpen(true)
        }}
        openingPdfCotizacionId={openingPdfCotizacionId}
        downloadingPdfCotizacionId={downloadingPdfCotizacionId}
      />

      <CotizacionDetalleModal
        open={detailOpen}
        detalle={detalle}
        loading={detailLoading}
        error={detailError}
        onRetry={() => {
          void retryCotizacionDetalle()
        }}
        onOpenChange={(open) => {
          if (!open) {
            closeCotizacionDetalle()
          }
        }}
      />

      <CotizacionEstadoDialog
        open={estadoDialogOpen}
        target={estadoTarget}
        onOpenChange={(open) => {
          setEstadoDialogOpen(open)
          if (!open) {
            setEstadoTarget(null)
          }
        }}
        onSubmit={handleUpdateEstado}
      />

      <CotizacionConvertirVentaDialog
        open={convertDialogOpen}
        target={convertTarget}
        onOpenChange={(open) => {
          setConvertDialogOpen(open)
          if (!open) {
            setConvertTarget(null)
          }
        }}
        onConverted={(payload) => {
          void handleConverted(payload)
        }}
      />
    </div>
  )
}
