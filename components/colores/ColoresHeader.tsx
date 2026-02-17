import { memo } from "react"
import { PlusIcon } from "@heroicons/react/24/outline"

interface ColoresHeaderProps {
  onOpenCreate: () => void
}

function ColoresHeaderComponent({ onOpenCreate }: ColoresHeaderProps) {
  return (
    <div className="shrink-0">
      <button
        onClick={onOpenCreate}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
      >
        <PlusIcon className="h-4 w-4" />
        Nuevo Color
      </button>
    </div>
  )
}

export const ColoresHeader = memo(ColoresHeaderComponent)
