import { useState } from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Producto } from "@/lib/types/producto"

interface ProductoDeleteDialogProps {
  open: boolean
  target: Producto | null
  onOpenChange: (open: boolean) => void
  onDelete: (id: number) => Promise<boolean>
}

export function ProductoDeleteDialog({
  open,
  target,
  onOpenChange,
  onDelete,
}: ProductoDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) return
    onOpenChange(nextOpen)
  }

  const handleDelete = async () => {
    if (!target) return

    setIsDeleting(true)
    try {
      const success = await onDelete(target.idProducto)
      if (success) {
        onOpenChange(false)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]" showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Eliminar Producto</DialogTitle>
          <DialogDescription>
            {`Estas seguro de eliminar el producto "${target?.nombre ?? ""}"?`}
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
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
