"use client"

import { useState } from "react"

import { PagosFilters } from "@/components/pagos/PagosFilters"
import { PagosTable } from "@/components/pagos/PagosTable"
import { usePagoReportePdf } from "@/lib/hooks/usePagoReportePdf"
import { usePagos } from "@/lib/hooks/usePagos"
import { createDefaultPagoFilters } from "@/lib/pago-filters"
import type { PagoFilters } from "@/lib/types/pago"

export function PagosPage() {
  const [filters, setFilters] = useState<PagoFilters>(createDefaultPagoFilters)
  const { isExporting, exportReportePdf } = usePagoReportePdf()
  const {
    pagos,
    page,
    totalPages,
    totalElements,
    numberOfElements,
    loading,
    error,
    setDisplayedPage,
    refreshPagos,
  } = usePagos(filters)

  return (
    <div className="space-y-4">
      <PagosFilters
        filters={filters}
        numberOfElements={numberOfElements}
        totalElements={totalElements}
        reportLoading={isExporting}
        onChange={setFilters}
        onDownloadReport={() => {
          void exportReportePdf(filters)
        }}
        onClear={() => setFilters(createDefaultPagoFilters())}
      />

      <PagosTable
        pagos={pagos}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onRetry={() => {
          void refreshPagos()
        }}
        onPageChange={setDisplayedPage}
      />
    </div>
  )
}
