import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { VariantRow } from "@/lib/types/producto-create"

interface ProductoVariantDeleteDialogProps {
  open: boolean
  target: VariantRow | null
  deletingVariantKeys: string[]
  onOpenChange: (open: boolean) => void
  onConfirmDelete: (key: string) => Promise<boolean> | boolean
}

export function ProductoVariantDeleteDialog({
  open,
  target,
  deletingVariantKeys,
  onOpenChange,
  onConfirmDelete,
}: ProductoVariantDeleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDeletingTarget = useMemo(
    () =>
      Boolean(target?.key) && deletingVariantKeys.includes(target?.key ?? ""),
    [deletingVariantKeys, target?.key]
  )

  const isDeleting = isSubmitting || isDeletingTarget

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) return
    onOpenChange(nextOpen)
  }

  const handleDelete = async () => {
    if (!target || isDeleting) return

    setIsSubmitting(true)
    try {
      const success = await onConfirmDelete(target.key)
      if (success) {
        onOpenChange(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]" showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Eliminar Variante</DialogTitle>
          <DialogDescription>
            {`Estas seguro de eliminar la variante "${target?.color.nombre ?? ""}/${target?.talla.nombre ?? ""}"?`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              void handleDelete()
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
