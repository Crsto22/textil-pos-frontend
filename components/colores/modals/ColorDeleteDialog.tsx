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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import type { Color } from "@/lib/types/color"

interface ColorDeleteDialogProps {
  open: boolean
  target: Color | null
  onOpenChange: (open: boolean) => void
  onDelete: (id: number) => Promise<boolean>
}

export function ColorDeleteDialog({ open, target, onOpenChange, onDelete }: ColorDeleteDialogProps) {
  const isMobile = useIsMobile()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) return
    onOpenChange(nextOpen)
  }

  const handleDelete = async () => {
    if (!target) return
    setIsDeleting(true)
    try {
      const success = await onDelete(target.idColor)
      if (success) onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const description = `Estas seguro de eliminar el color "${target?.nombre ?? ""}"?`

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="flex flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Eliminar Color</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-4"><p className="text-sm text-muted-foreground">{description}</p></div>
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={isDeleting} onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? "Eliminando..." : "Eliminar"}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]" showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Eliminar Color</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" disabled={isDeleting}>Cancelar</Button></DialogClose>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? "Eliminando..." : "Eliminar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
