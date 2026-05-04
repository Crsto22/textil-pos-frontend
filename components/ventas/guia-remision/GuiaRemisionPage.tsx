"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { GuiaRemisionFilters } from "@/components/ventas/guia-remision/GuiaRemisionFilters"
import { GuiaRemisionTable } from "@/components/ventas/guia-remision/GuiaRemisionTable"
import { useGuiasRemision } from "@/lib/hooks/useGuiasRemision"
import {
  downloadGuiaRemisionDocument,
  getGuiaRemisionDownloadConfig,
  type GuiaRemisionDocumentKind,
} from "@/lib/guia-remision-documents"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
import type {
  GuiaRemisionFilters as Filters,
  GuiaRemisionListItem,
} from "@/lib/types/guia-remision"
import type { GuiaDocumentKind } from "@/components/ventas/guia-remision/GuiaRemisionTable"

const DEFAULT_FILTERS: Filters = {
  search: "",
  estado: "TODOS",
  sunatEstado: "TODOS",
  idSucursal: null,
}

export function GuiaRemisionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [filters, setFilters] = useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
    idSucursal: user?.idSucursal ?? null,
  }))
  const [emitiendo, setEmitiendo] = useState<number | null>(null)
  const [consultandoCdr, setConsultandoCdr] = useState<number | null>(null)
  const [downloadingDocument, setDownloadingDocument] = useState<{
    idGuiaRemision: number
    kind: GuiaDocumentKind
  } | null>(null)

  const {
    guias,
    page,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setDisplayedPage,
    refreshGuias,
  } = useGuiasRemision(filters)

  const handleClearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS, idSucursal: user?.idSucursal ?? null })
  }

  const handleViewDetail = (guia: GuiaRemisionListItem) => {
    router.push(`/ventas/guia-remision/${guia.idGuiaRemision}`)
  }

  const handleEmitir = async (guia: GuiaRemisionListItem) => {
    setEmitiendo(guia.idGuiaRemision)
    try {
      const response = await authFetch(
        `/api/guia-remision/${guia.idGuiaRemision}/emitir`,
        { method: "POST" }
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          data && typeof data === "object" && typeof data.message === "string"
            ? data.message
            : "No se pudo emitir la guia de remision remitente"
        toast.error(message)
        return
      }

      toast.success("Guia de remision emitida correctamente")
      await refreshGuias()
    } catch {
      toast.error("Error de conexion al emitir la guia")
    } finally {
      setEmitiendo(null)
    }
  }

  const handleDownloadDocument = async (
    guiaId: number,
    kind: GuiaDocumentKind
  ) => {
    setDownloadingDocument({ idGuiaRemision: guiaId, kind })

    const result = await downloadGuiaRemisionDocument(
      getGuiaRemisionDownloadConfig(kind as GuiaRemisionDocumentKind, {
        idGuiaRemision: guiaId,
      })
    )

    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }

    setDownloadingDocument((current) =>
      current?.idGuiaRemision === guiaId && current.kind === kind ? null : current
    )
  }

  const handleConsultarCdr = async (guia: GuiaRemisionListItem) => {
    setConsultandoCdr(guia.idGuiaRemision)
    try {
      const response = await authFetch(
        `/api/guia-remision/${guia.idGuiaRemision}/consultar-cdr`,
        { method: "POST" }
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          data && typeof data === "object" && typeof data.message === "string"
            ? data.message
            : "No se pudo consultar el CDR de la guia"
        toast.error(message)
        return
      }

      toast.success(
        data && typeof data === "object" && typeof data.message === "string"
          ? data.message
          : "Consulta de CDR ejecutada correctamente"
      )
      await refreshGuias()
    } catch {
      toast.error("Error de conexion al consultar el CDR")
    } finally {
      setConsultandoCdr(null)
    }
  }

  return (
    <div className="space-y-4">
      <GuiaRemisionFilters
        filters={filters}
        totalShown={guias.length}
        pageElements={numberOfElements}
        totalElements={totalElements}
        onChange={setFilters}
        onClear={handleClearFilters}
        onRefresh={() => { void refreshGuias() }}
      />

      <GuiaRemisionTable
        guias={guias}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onRetry={() => {
          void refreshGuias()
        }}
        onPageChange={setDisplayedPage}
        onViewDetail={handleViewDetail}
        onEmitir={(guia) => {
          void handleEmitir(guia)
        }}
        emitiendo={emitiendo}
        onConsultarCdr={(guia) => {
          void handleConsultarCdr(guia)
        }}
        consultandoCdr={consultandoCdr}
        onDownloadDocument={(guia, kind) => {
          void handleDownloadDocument(guia.idGuiaRemision, kind)
        }}
        downloadingDocument={downloadingDocument}
      />

    </div>
  )
}
