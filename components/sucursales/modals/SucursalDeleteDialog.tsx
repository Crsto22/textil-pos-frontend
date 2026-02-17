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
import type { Sucursal } from "@/lib/types/sucursal"

interface SucursalDeleteDialogProps {
  open: boolean
  target: Sucursal | null
  onOpenChange: (open: boolean) => void
  onDelete: (id: number) => Promise<boolean>
}

export function SucursalDeleteDialog({
  open,
  target,
  onOpenChange,
  onDelete,
}: SucursalDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) return
    onOpenChange(nextOpen)
  }

  const handleDelete = async () => {
    if (!target) return

    setIsDeleting(true)
    try {
      const success = await onDelete(target.idSucursal)
      if (success) {
        onOpenChange(false)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-100" showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Eliminar Sucursal</DialogTitle>
          <DialogDescription>
            ¿Estas seguro de eliminar{" "}
            <span className="font-semibold text-foreground">{target?.nombre}</span>? Esta
            accion desactivara logicamente la sucursal.
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
