import { useCallback, useEffect, useState } from "react"

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
import type { CategoriaCreateRequest } from "@/lib/types/categoria"

interface CategoriaCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: CategoriaCreateRequest) => Promise<boolean>
  initialNombreCategoria?: string
  initialDescripcion?: string
}

export function CategoriaCreateDialog({
  open,
  onOpenChange,
  onCreate,
  initialNombreCategoria = "",
  initialDescripcion = "",
}: CategoriaCreateDialogProps) {
  const isMobile = useIsMobile()

  const buildInitialForm = useCallback(
    (): CategoriaCreateRequest => ({ nombreCategoria: initialNombreCategoria, descripcion: initialDescripcion }),
    [initialDescripcion, initialNombreCategoria]
  )

  const [form, setForm] = useState<CategoriaCreateRequest>(buildInitialForm)
  const [isSaving, setIsSaving] = useState(false)
  const isCreateValid = form.nombreCategoria.trim() !== ""

  useEffect(() => {
    if (!open) return
    setForm(buildInitialForm())
  }, [buildInitialForm, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
    if (!nextOpen) setForm(buildInitialForm())
  }

  const handleCreate = async () => {
    if (!isCreateValid) return
    setIsSaving(true)
    try {
      const success = await onCreate({ nombreCategoria: form.nombreCategoria.trim(), descripcion: form.descripcion.trim() })
      if (success) handleOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const formBody = (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="categoria-create-nombre">Nombre</Label>
        <Input id="categoria-create-nombre" placeholder="Ej. Polos" value={form.nombreCategoria} onChange={(e) => setForm((prev) => ({ ...prev, nombreCategoria: e.target.value }))} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="categoria-create-descripcion">Descripcion</Label>
        <Textarea id="categoria-create-descripcion" placeholder="Ej. Linea casual" rows={2} value={form.descripcion} onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))} className="resize-none" />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="flex flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Nueva Categoria</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-4">{formBody}</div>
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button type="button" className="flex-1" onClick={handleCreate} disabled={!isCreateValid || isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Nueva Categoria</DialogTitle>
          <DialogDescription>Completa los datos para crear una nueva categoria.</DialogDescription>
        </DialogHeader>
        {formBody}
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
          <Button type="button" onClick={handleCreate} disabled={!isCreateValid || isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
