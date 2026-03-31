"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { NotasCreditoFilters } from "@/components/ventas/nota-credito/NotasCreditoFilters"
import { NotasCreditoTable } from "@/components/ventas/nota-credito/NotasCreditoTable"
import {
  downloadNotaCreditoDocument,
  getNotaCreditoDownloadConfig,
  type NotaCreditoDocumentKind,
} from "@/lib/nota-credito-documents"
import { useNotasCreditoHistorial } from "@/lib/hooks/useNotasCreditoHistorial"
import type { NotaCreditoHistorialFilters } from "@/lib/types/nota-credito"

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
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<NotaCreditoHistorialFilters>({
    ...DEFAULT_FILTERS,
    idVenta: parsePositiveNumber(searchParams.get("idVenta")),
  })
  const [downloadingDocument, setDownloadingDocument] = useState<{
    idNotaCredito: number
    kind: NotaCreditoDocumentKind
  } | null>(null)
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
        onDownloadDocument={(notaCredito, kind) => {
          void handleDownloadDocument(notaCredito.idNotaCredito, kind)
        }}
        downloadingDocument={downloadingDocument}
      />
    </div>
  )
}
