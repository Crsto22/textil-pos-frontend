"use client"

import { ArrowPathIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"

interface ProductoUnsavedChangesToastProps {
  visible: boolean
  isSaving: boolean
  onDiscard: () => void
  onSave: () => void
}

export function ProductoUnsavedChangesToast({
  visible,
  isSaving,
  onDiscard,
  onSave,
}: ProductoUnsavedChangesToastProps) {
  if (!visible) return null

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="pointer-events-auto w-[360px] rounded-xl border bg-card p-4 text-card-foreground shadow-lg">
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onDiscard}
            disabled={isSaving}
            className="h-11 text-base font-semibold"
          >
            Descartar
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="h-11 text-base font-semibold"
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
