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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
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
  const isMobile = useIsMobile()
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
      if (success) onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const description = `Estas seguro de eliminar la variante "${target?.productName ?? ""} - ${target?.colorName ?? ""} / ${target?.tallaName ?? ""}"? Esta accion es irreversible.`

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="flex flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Eliminar Variante</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-4">
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={isDeleting} onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" className="flex-1" onClick={() => void handleDelete()} disabled={isDeleting || !target?.variantId}>
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]" showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Eliminar Variante</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>Cancelar</Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting || !target?.variantId}>
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
