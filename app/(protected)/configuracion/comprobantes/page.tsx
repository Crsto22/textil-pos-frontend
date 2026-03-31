"use client"

import { useCallback, useEffect, useMemo, startTransition, useState } from "react"

import { ComprobantesFilters } from "@/components/comprobantes/ComprobantesFilters"
import { ComprobantesHeader } from "@/components/comprobantes/ComprobantesHeader"
import { ComprobantesPagination } from "@/components/comprobantes/ComprobantesPagination"
import { ComprobantesSearch } from "@/components/comprobantes/ComprobantesSearch"
import { ComprobantesTable } from "@/components/comprobantes/ComprobantesTable"
import { ComprobanteCreateDialog } from "@/components/comprobantes/modals/ComprobanteCreateDialog"
import { ComprobanteEditDialog } from "@/components/comprobantes/modals/ComprobanteEditDialog"
import { useAuth } from "@/lib/auth/auth-context"
import { useComprobantes } from "@/lib/hooks/useComprobantes"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useSucursalGlobal } from "@/lib/sucursal-global-context"
import type { ComprobanteConfig } from "@/lib/types/comprobante"

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

export default function ComprobantesPage() {
  const { user } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<ComprobanteConfig | null>(null)

  const {
    isAdmin,
    error,
    search,
    setSearch,
    activoFilter,
    setActivoFilter,
    idSucursalFilter,
    setIdSucursalFilter,
    needsSucursalSelection,
    displayedComprobantes,
    displayedTotalPages,
    displayedTotalElements,
    displayedPage,
    displayedLoading,
    setDisplayedPage,
    fetchComprobanteDetalle,
    createComprobante,
    updateComprobante,
  } = useComprobantes()

  const {
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(isAdmin)

  const { sucursalGlobal } = useSucursalGlobal()
  useEffect(() => {
    if (!isAdmin || sucursalGlobal === null) return
    startTransition(() => setIdSucursalFilter(sucursalGlobal.idSucursal))
  }, [sucursalGlobal, isAdmin, setIdSucursalFilter])

  const userSucursalLabel = useMemo(() => {
    if (hasValidSucursalId(user?.idSucursal)) {
      return user?.nombreSucursal || `Sucursal #${user?.idSucursal}`
    }

    return "Sin sucursal asignada"
  }, [user?.idSucursal, user?.nombreSucursal])

  const handleOpenCreate = useCallback(() => {
    setShowCreate(true)
  }, [])

  const handleEditComprobante = useCallback((comprobante: ComprobanteConfig) => {
    setEditTarget(comprobante)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-full xl:max-w-md">
          <ComprobantesSearch search={search} onSearchChange={setSearch} />
        </div>
        <ComprobantesHeader canManage={isAdmin} onOpenCreate={handleOpenCreate} />
      </div>

      <ComprobantesFilters
        isAdmin={isAdmin}
        idSucursal={idSucursalFilter}
        onIdSucursalChange={setIdSucursalFilter}
        activoFilter={activoFilter}
        onActivoFilterChange={setActivoFilter}
        sucursalOptions={sucursalOptions}
        loadingSucursales={loadingSucursales}
        errorSucursales={errorSucursales}
        searchSucursal={searchSucursal}
        onSearchSucursalChange={setSearchSucursal}
        userSucursalLabel={userSucursalLabel}
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {needsSucursalSelection ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-card px-6 py-10 text-center dark:border-slate-700">
          <p className="text-sm font-medium text-foreground">
            Selecciona una sucursal para ver sus configuraciones.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            El listado se cargara apenas elijas una sucursal en el filtro superior.
          </p>
        </div>
      ) : (
        <>
          <ComprobantesTable
            comprobantes={displayedComprobantes}
            loading={displayedLoading}
            canManage={isAdmin}
            onEditComprobante={handleEditComprobante}
          />

          <ComprobantesPagination
            totalElements={displayedTotalElements}
            totalPages={displayedTotalPages}
            page={displayedPage}
            onPageChange={setDisplayedPage}
          />
        </>
      )}

      {isAdmin ? (
        <>
          <ComprobanteCreateDialog
            open={showCreate}
            onOpenChange={setShowCreate}
            onCreate={createComprobante}
            initialIdSucursal={idSucursalFilter}
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
