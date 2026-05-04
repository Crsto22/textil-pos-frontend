"use client"

import { useCallback, useState } from "react"

import { ComprobantesFilters } from "@/components/comprobantes/ComprobantesFilters"
import { ComprobantesHeader } from "@/components/comprobantes/ComprobantesHeader"
import { ComprobantesPagination } from "@/components/comprobantes/ComprobantesPagination"
import { ComprobantesSearch } from "@/components/comprobantes/ComprobantesSearch"
import { ComprobantesTable } from "@/components/comprobantes/ComprobantesTable"
import { ComprobanteCreateDialog } from "@/components/comprobantes/modals/ComprobanteCreateDialog"
import { ComprobanteEditDialog } from "@/components/comprobantes/modals/ComprobanteEditDialog"
import { useComprobantes } from "@/lib/hooks/useComprobantes"
import type { ComprobanteConfig } from "@/lib/types/comprobante"

export default function ComprobantesPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<ComprobanteConfig | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const {
    isAdmin,
    error,
    search,
    setSearch,
    activoFilter,
    setActivoFilter,
    displayedComprobantes,
    displayedTotalPages,
    displayedTotalElements,
    displayedPage,
    displayedLoading,
    setDisplayedPage,
    refreshCurrentView,
    fetchComprobanteDetalle,
    createComprobante,
    updateComprobante,
    toggleActivo,
  } = useComprobantes()

  const handleOpenCreate = useCallback(() => {
    setShowCreate(true)
  }, [])

  const handleEditComprobante = useCallback((comprobante: ComprobanteConfig) => {
    setEditTarget(comprobante)
  }, [])

  const handleToggleActivo = useCallback(
    async (comprobante: ComprobanteConfig) => {
      setTogglingId(comprobante.idComprobante)
      await toggleActivo(comprobante)
      setTogglingId(null)
    },
    [toggleActivo]
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search + header row */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <ComprobantesSearch search={search} onSearchChange={setSearch} />
        </div>
        <div className="shrink-0">
          <ComprobantesHeader
            canManage={isAdmin}
            onOpenCreate={handleOpenCreate}
            onRefresh={() => { void refreshCurrentView() }}
          />
        </div>
      </div>

      {/* Filters */}
      <ComprobantesFilters
        activoFilter={activoFilter}
        onActivoFilterChange={setActivoFilter}
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <ComprobantesTable
        comprobantes={displayedComprobantes}
        loading={displayedLoading}
        canManage={isAdmin}
        onEditComprobante={handleEditComprobante}
        onToggleActivo={handleToggleActivo}
        togglingId={togglingId}
      />

      <ComprobantesPagination
        totalElements={displayedTotalElements}
        totalPages={displayedTotalPages}
        page={displayedPage}
        onPageChange={setDisplayedPage}
      />

      {isAdmin ? (
        <>
          <ComprobanteCreateDialog
            open={showCreate}
            onOpenChange={setShowCreate}
            onCreate={createComprobante}
          />

          <ComprobanteEditDialog
            open={editTarget !== null}
            comprobante={editTarget}
            onOpenChange={(open) => {
              if (!open) setEditTarget(null)
            }}
            onLoadDetail={fetchComprobanteDetalle}
            onUpdate={updateComprobante}
          />
        </>
      ) : null}
    </div>
  )
}
