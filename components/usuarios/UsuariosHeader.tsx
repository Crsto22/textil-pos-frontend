import { memo } from "react"
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline"

import type { Usuario } from "@/lib/types/usuario"

interface UsuariosHeaderProps {
  isSearchMode: boolean
  displayedTotalElements: number
  debouncedSearch: string
  totalElements: number
  activeCount: number
  selectedUser: Usuario | null
  onOpenCreate: () => void
  onOpenEdit: () => void
}

function UsuariosHeaderComponent({
  isSearchMode,
  displayedTotalElements,
  debouncedSearch,
  totalElements,
  activeCount,
  selectedUser,
  onOpenCreate,
  onOpenEdit,
}: UsuariosHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold">Gestión de Usuarios</h2>
        <p className="text-sm text-muted-foreground">
          {isSearchMode
            ? `${displayedTotalElements} resultado${displayedTotalElements !== 1 ? "s" : ""} para "${debouncedSearch}"`
            : (
                <>
                  {totalElements} usuarios registrados • {activeCount} activos
                </>
              )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {selectedUser && (
          <button
            onClick={onOpenEdit}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Editar
          </button>
        )}

        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>
    </div>
  )
}

export const UsuariosHeader = memo(UsuariosHeaderComponent)
