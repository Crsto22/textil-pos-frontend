import { memo } from "react"
import { ArrowPathIcon, EyeIcon, PlusIcon } from "@heroicons/react/24/outline"

interface ComprobantesHeaderProps {
  canManage: boolean
  onOpenCreate: () => void
  onRefresh?: () => void
}

function ComprobantesHeaderComponent({
  canManage,
  onOpenCreate,
  onRefresh,
}: ComprobantesHeaderProps) {
  const refreshBtn = onRefresh ? (
    <button
      type="button"
      onClick={onRefresh}
      className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-3 text-muted-foreground transition-colors hover:bg-muted"
      title="Recargar lista"
    >
      <ArrowPathIcon className="h-4 w-4" />
    </button>
  ) : null

  if (!canManage) {
    return (
      <div className="flex items-center gap-2">
        {refreshBtn}
        <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
          <EyeIcon className="h-4 w-4" />
          Modo consulta
        </div>
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {refreshBtn}
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
