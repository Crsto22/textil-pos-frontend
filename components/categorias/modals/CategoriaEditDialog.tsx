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
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import type { Categoria, CategoriaUpdateRequest } from "@/lib/types/categoria"

interface CategoriaEditDialogProps {
  open: boolean
  categoria: Categoria | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: CategoriaUpdateRequest) => Promise<boolean>
}

export function CategoriaEditDialog({ open, categoria, onOpenChange, onUpdate }: CategoriaEditDialogProps) {
  const isMobile = useIsMobile()
  const [form, setForm] = useState<CategoriaUpdateRequest>({ nombreCategoria: "", descripcion: "" })
  const [isUpdating, setIsUpdating] = useState(false)
  const isEditValid = form.nombreCategoria.trim() !== ""

  useEffect(() => {
    if (!open || !categoria) return
    setForm({ nombreCategoria: categoria.nombreCategoria, descripcion: categoria.descripcion ?? "" })
  }, [categoria, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isUpdating) return
    onOpenChange(nextOpen)
    if (!nextOpen) setForm({ nombreCategoria: "", descripcion: "" })
  }

  const handleUpdate = async () => {
    if (!categoria || !isEditValid) return
    setIsUpdating(true)
    try {
      const success = await onUpdate(categoria.idCategoria, { nombreCategoria: form.nombreCategoria.trim(), descripcion: form.descripcion.trim() })
      if (success) handleOpenChange(false)
    } finally {
      setIsUpdating(false)
    }
  }

  const formBody = (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="categoria-edit-nombre">Nombre</Label>
        <Input id="categoria-edit-nombre" value={form.nombreCategoria} onChange={(e) => setForm((prev) => ({ ...prev, nombreCategoria: e.target.value }))} placeholder="Ej. Polos" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="categoria-edit-descripcion">Descripcion</Label>
        <Textarea id="categoria-edit-descripcion" value={form.descripcion} onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))} rows={2} placeholder="Ej. Linea actualizada" className="resize-none" />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="flex flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Editar Categoria</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-4">{formBody}</div>
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={isUpdating} onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button type="button" className="flex-1" onClick={handleUpdate} disabled={!isEditValid || isUpdating}>{isUpdating ? "Guardando..." : "Guardar cambios"}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton={!isUpdating}>
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogDescription>Modifica los datos de la categoria seleccionada.</DialogDescription>
        </DialogHeader>
        {formBody}
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" disabled={isUpdating}>Cancelar</Button></DialogClose>
          <Button type="button" onClick={handleUpdate} disabled={!isEditValid || isUpdating}>{isUpdating ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
