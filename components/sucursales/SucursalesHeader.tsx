import { memo } from "react"
import { PlusIcon } from "@heroicons/react/24/outline"

interface SucursalesHeaderProps {
  totalElements: number
  activeCount: number
  onOpenCreate: () => void
}

function SucursalesHeaderComponent({
  totalElements,
  activeCount,
  onOpenCreate,
}: SucursalesHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sucursales</h1>
        <p className="text-sm text-muted-foreground">
          Gestion de sedes - {activeCount} operativas de {totalElements}
        </p>
      </div>

      <div className="shrink-0">
        <button
          onClick={onOpenCreate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva Sucursal
        </button>
      </div>
    </div>
  )
}

export const SucursalesHeader = memo(SucursalesHeaderComponent)
