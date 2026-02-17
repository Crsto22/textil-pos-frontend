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
import type { Categoria } from "@/lib/types/categoria"

interface CategoriaDeleteDialogProps {
  open: boolean
  target: Categoria | null
  onOpenChange: (open: boolean) => void
  onDelete: (id: number) => Promise<boolean>
}

export function CategoriaDeleteDialog({
  open,
  target,
  onOpenChange,
  onDelete,
}: CategoriaDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) return
    onOpenChange(nextOpen)
  }

  const handleDelete = async () => {
    if (!target) return

    setIsDeleting(true)
    try {
      const success = await onDelete(target.idCategoria)
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
          <DialogTitle>Eliminar Categoria</DialogTitle>
          <DialogDescription>
            {`Estas seguro de eliminar la categoria "${target?.nombreCategoria ?? ""}"?`}
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
