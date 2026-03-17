import { useState } from "react"

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
import type { CatalogVariantItem } from "@/lib/catalog-view"

interface ProductoVarianteDeleteDialogProps {
  open: boolean
  target: CatalogVariantItem | null
  onOpenChange: (open: boolean) => void
  onDelete: (id: number) => Promise<boolean>
}

export function ProductoVarianteDeleteDialog({
  open,
  target,
  onOpenChange,
  onDelete,
}: ProductoVarianteDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) return
    onOpenChange(nextOpen)
  }

  const handleDelete = async () => {
    if (!target?.variantId) return

    setIsDeleting(true)
    try {
      const success = await onDelete(target.variantId)
      if (success) {
        onOpenChange(false)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]" showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Eliminar Variante</DialogTitle>
          <DialogDescription>
            {`Estas seguro de eliminar la variante "${target?.productName ?? ""} - ${target?.colorName ?? ""} / ${target?.tallaName ?? ""}"? Esta accion es irreversible.`}
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
            disabled={isDeleting || !target?.variantId}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
