"use client"

import { useCallback, useState } from "react"

import { TurnosHeader } from "@/components/turnos/TurnosHeader"
import { TurnosPagination } from "@/components/turnos/TurnosPagination"
import { TurnosSearch } from "@/components/turnos/TurnosSearch"
import { TurnosTable } from "@/components/turnos/TurnosTable"
import { TurnoCreateDialog } from "@/components/turnos/modals/TurnoCreateDialog"
import { TurnoDeleteDialog } from "@/components/turnos/modals/TurnoDeleteDialog"
import { TurnoEditDialog } from "@/components/turnos/modals/TurnoEditDialog"
import { useTurnos } from "@/lib/hooks/useTurnos"
import type { Turno } from "@/lib/types/turno"

export default function TurnosPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Turno | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Turno | null>(null)

  const {
    search,
    setSearch,
    displayedTurnos,
    displayedLoading,
    displayedTotalElements,
    displayedTotalPages,
    displayedPage,
    setDisplayedPage,
    createTurno,
    updateTurno,
    deleteTurno,
  } = useTurnos()

  const handleOpenCreate = useCallback(() => {
    setShowCreate(true)
  }, [])

  const handleEditTurno = useCallback((turno: Turno) => {
    setEditTarget(turno)
  }, [])

  const handleDeleteTurno = useCallback((turno: Turno) => {
    setDeleteTarget(turno)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-full xl:max-w-md">
          <TurnosSearch search={search} onSearchChange={setSearch} />
        </div>
        <TurnosHeader onOpenCreate={handleOpenCreate} />
      </div>

      <TurnosTable
        turnos={displayedTurnos}
        loading={displayedLoading}
        onEditTurno={handleEditTurno}
        onDeleteTurno={handleDeleteTurno}
      />

      <TurnosPagination
        totalElements={displayedTotalElements}
        totalPages={displayedTotalPages}
        page={displayedPage}
        onPageChange={setDisplayedPage}
      />

      <TurnoCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createTurno}
      />

      <TurnoEditDialog
        open={editTarget !== null}
        turno={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        onUpdate={updateTurno}
      />

      <TurnoDeleteDialog
        open={deleteTarget !== null}
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onDelete={deleteTurno}
      />
    </div>
  )
}
