import { memo } from "react"
import { PlusIcon } from "@heroicons/react/24/outline"

interface UsuariosHeaderProps {
  onOpenCreate: () => void
}

function UsuariosHeaderComponent({ onOpenCreate }: UsuariosHeaderProps) {
  return (
    <div className="shrink-0">
      <button
        onClick={onOpenCreate}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
      >
        <PlusIcon className="h-4 w-4" />
        Nuevo Usuario
      </button>
    </div>
  )
}

export const UsuariosHeader = memo(UsuariosHeaderComponent)
