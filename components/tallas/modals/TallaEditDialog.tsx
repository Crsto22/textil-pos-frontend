import { useEffect, useState } from "react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import type { Talla, TallaUpdateRequest } from "@/lib/types/talla"

interface TallaEditDialogProps {
  open: boolean
  talla: Talla | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: TallaUpdateRequest) => Promise<boolean>
}

export function TallaEditDialog({ open, talla, onOpenChange, onUpdate }: TallaEditDialogProps) {
  const isMobile = useIsMobile()
  const [nombre, setNombre] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!open || !talla) return
    setNombre(talla.nombre)
  }, [open, talla])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isUpdating) return
    onOpenChange(nextOpen)
    if (!nextOpen) setNombre("")
  }

  const handleUpdate = async () => {
    if (!talla) return
    const trimmedNombre = nombre.trim()
    if (!trimmedNombre) return
    setIsUpdating(true)
    try {
      const success = await onUpdate(talla.idTalla, { nombre: trimmedNombre })
      if (success) handleOpenChange(false)
    } finally {
      setIsUpdating(false)
    }
  }

  const formBody = (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="talla-edit-nombre">Nombre</Label>
        <Input id="talla-edit-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={20} placeholder="Ej. XL" />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="flex flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Editar Talla</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-4">{formBody}</div>
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={isUpdating} onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button type="button" className="flex-1" onClick={handleUpdate} disabled={!nombre.trim() || isUpdating}>{isUpdating ? "Guardando..." : "Guardar cambios"}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]" showCloseButton={!isUpdating}>
        <DialogHeader>
          <DialogTitle>Editar Talla</DialogTitle>
          <DialogDescription>{`Actualiza el nombre de la talla "${talla?.nombre ?? ""}".`}</DialogDescription>
        </DialogHeader>
        {formBody}
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" disabled={isUpdating}>Cancelar</Button></DialogClose>
          <Button type="button" onClick={handleUpdate} disabled={!nombre.trim() || isUpdating}>{isUpdating ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
