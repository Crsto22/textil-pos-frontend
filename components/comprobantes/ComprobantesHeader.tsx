import { memo } from "react"
import { EyeIcon, PlusIcon } from "@heroicons/react/24/outline"

interface ComprobantesHeaderProps {
  canManage: boolean
  onOpenCreate: () => void
}

function ComprobantesHeaderComponent({
  canManage,
  onOpenCreate,
}: ComprobantesHeaderProps) {
  if (!canManage) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
        <EyeIcon className="h-4 w-4" />
        Modo consulta
      </div>
    )
  }

  return (
    <div className="shrink-0">
      <button
        onClick={onOpenCreate}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
      >
        <PlusIcon className="h-4 w-4" />
        Nueva Configuracion
      </button>
    </div>
  )
}

export const ComprobantesHeader = memo(ComprobantesHeaderComponent)
