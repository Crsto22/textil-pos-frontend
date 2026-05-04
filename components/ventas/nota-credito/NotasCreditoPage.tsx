"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { AnularNotaCreditoDialog } from "@/components/ventas/nota-credito/AnularNotaCreditoDialog"
import { NotasCreditoFilters } from "@/components/ventas/nota-credito/NotasCreditoFilters"
import { NotasCreditoTable } from "@/components/ventas/nota-credito/NotasCreditoTable"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  downloadNotaCreditoDocument,
  getNotaCreditoDownloadConfig,
  type NotaCreditoDocumentKind,
} from "@/lib/nota-credito-documents"
import { useNotasCreditoHistorial } from "@/lib/hooks/useNotasCreditoHistorial"
import type {
  NotaCreditoBajaInfo,
  NotaCreditoBajaRequest,
  NotaCreditoBajaResult,
  NotaCreditoHistorial,
  NotaCreditoHistorialFilters,
} from "@/lib/types/nota-credito"

function getTodayDateValue(): string {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

function parsePositiveNumber(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const TODAY_DATE = getTodayDateValue()

const DEFAULT_FILTERS: NotaCreditoHistorialFilters = {
  search: "",
  idVenta: null,
  estado: "TODOS",
  idUsuario: null,
  idCliente: null,
  codigoMotivo: "TODOS",
  periodo: "HOY",
  fecha: TODAY_DATE,
  fechaDesde: TODAY_DATE,
  fechaHasta: TODAY_DATE,
  usarRangoFechas: false,
  idSucursal: null,
}

export function NotasCreditoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<NotaCreditoHistorialFilters>({
    ...DEFAULT_FILTERS,
    idVenta: parsePositiveNumber(searchParams.get("idVenta")),
  })
  const [downloadingDocument, setDownloadingDocument] = useState<{
    idNotaCredito: number
    kind: NotaCreditoDocumentKind
  } | null>(null)
  const [bajaAction, setBajaAction] = useState<{
    idNotaCredito: number
    kind: "solicitar-baja" | "consultar-ticket"
  } | null>(null)
  const [bajaInfo, setBajaInfo] = useState<NotaCreditoBajaInfo | null>(null)
  const [bajaDialogOpen, setBajaDialogOpen] = useState(false)
  const [enviandoBaja, setEnviandoBaja] = useState(false)
  const {
    notasCredito,
    page,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setDisplayedPage,
    refreshNotasCredito,
  } = useNotasCreditoHistorial(filters)

  const estadoOptions = useMemo(() => {
    const values = new Set<string>()
    notasCredito.forEach((notaCredito) => {
      if (notaCredito.estado?.trim()) values.add(notaCredito.estado.trim().toUpperCase())
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [notasCredito])

  const filteredNotasCredito = useMemo(() => {
    if (filters.estado === "TODOS") return notasCredito
    return notasCredito.filter(
      (notaCredito) =>
        notaCredito.estado.trim().toUpperCase() === filters.estado.trim().toUpperCase()
    )
  }, [filters.estado, notasCredito])

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const handleDownloadDocument = async (
    notaCreditoId: number,
    kind: NotaCreditoDocumentKind
  ) => {
    setDownloadingDocument({ idNotaCredito: notaCreditoId, kind })

    const result = await downloadNotaCreditoDocument(
      getNotaCreditoDownloadConfig(kind, { idNotaCredito: notaCreditoId })
    )

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setDownloadingDocument((current) =>
      current?.idNotaCredito === notaCreditoId && current.kind === kind ? null : current
    )
  }

  const handleSolicitarBaja = (notaCredito: NotaCreditoHistorial) => {
    setBajaInfo({
      idNotaCredito: notaCredito.idNotaCredito,
      tipoComprobante: notaCredito.tipoComprobante,
      serie: notaCredito.serie,
      correlativo: notaCredito.correlativo,
      nombreCliente: notaCredito.nombreCliente,
      moneda: notaCredito.moneda,
      total: notaCredito.total,
    })
    setBajaDialogOpen(true)
  }

  const handleConfirmBaja = async (
    payload: NotaCreditoBajaRequest
  ): Promise<NotaCreditoBajaResult> => {
    if (!bajaInfo) {
      return { ok: false, message: "No hay nota de credito seleccionada", response: null }
    }

    setEnviandoBaja(true)
    setBajaAction({ idNotaCredito: bajaInfo.idNotaCredito, kind: "solicitar-baja" })
    try {
      const response = await authFetch(
        `/api/nota-credito/${bajaInfo.idNotaCredito}/sunat/baja`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          (typeof data?.message === "string" && data.message) ||
          "No se pudo solicitar la baja de la nota de credito"
        return { ok: false, message, response: null }
      }

      void refreshNotasCredito()
      return {
        ok: true,
        message:
          (typeof data?.message === "string" && data.message) ||
          "Solicitud de baja registrada correctamente",
        response: data,
      }
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al solicitar la baja de la nota de credito",
        response: null,
      }
    } finally {
      setEnviandoBaja(false)
      setBajaAction((current) =>
        current?.idNotaCredito === bajaInfo.idNotaCredito &&
        current.kind === "solicitar-baja"
          ? null
          : current
      )
    }
  }

  const handleConsultarBajaTicket = async (notaCredito: NotaCreditoHistorial) => {
    setBajaAction({ idNotaCredito: notaCredito.idNotaCredito, kind: "consultar-ticket" })
    try {
      const response = await authFetch(
        `/api/nota-credito/${notaCredito.idNotaCredito}/sunat/baja/consultar-ticket`,
        { method: "POST" }
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          (typeof data?.message === "string" && data.message) ||
          "No se pudo consultar el ticket de baja"
        toast.error(message)
        return
      }

      toast.success(
        (typeof data?.message === "string" && data.message) ||
          "Consulta de ticket ejecutada correctamente"
      )
      await refreshNotasCredito()
    } catch {
      toast.error("Error de conexion al consultar el ticket de baja")
    } finally {
      setBajaAction((current) =>
        current?.idNotaCredito === notaCredito.idNotaCredito &&
        current.kind === "consultar-ticket"
          ? null
          : current
      )
    }
  }

  return (
    <div className="space-y-4">
      <NotasCreditoFilters
        filters={filters}
        estadoOptions={estadoOptions}
        totalShown={filteredNotasCredito.length}
        pageElements={numberOfElements}
        totalElements={totalElements}
        createHref="/ventas/nota-credito/nueva"
        onChange={setFilters}
        onClear={handleClearFilters}
        onRefresh={() => { void refreshNotasCredito() }}
      />

      <NotasCreditoTable
        notasCredito={filteredNotasCredito}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onRetry={() => {
          void refreshNotasCredito()
        }}
        onPageChange={setDisplayedPage}
        onViewDetail={(notaCredito) => {
          router.push(`/ventas/nota-credito/${notaCredito.idNotaCredito}`)
        }}
        onDownloadDocument={(notaCredito, kind) => {
          void handleDownloadDocument(notaCredito.idNotaCredito, kind)
        }}
        onSolicitarBaja={handleSolicitarBaja}
        onConsultarBajaTicket={(notaCredito) => {
          void handleConsultarBajaTicket(notaCredito)
        }}
        downloadingDocument={downloadingDocument}
        bajaAction={bajaAction}
      />
      <AnularNotaCreditoDialog
        open={bajaDialogOpen}
        detalle={bajaInfo}
        isSubmitting={enviandoBaja}
        onOpenChange={(open) => {
          setBajaDialogOpen(open)
          if (!open) setBajaInfo(null)
        }}
        onConfirm={handleConfirmBaja}
      />
    </div>
  )
}
