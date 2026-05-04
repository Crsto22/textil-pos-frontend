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
import type { TallaCreateRequest } from "@/lib/types/talla"

interface TallaCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: TallaCreateRequest) => Promise<boolean>
  initialNombre?: string
}

export function TallaCreateDialog({ open, onOpenChange, onCreate, initialNombre = "" }: TallaCreateDialogProps) {
  const isMobile = useIsMobile()
  const [nombre, setNombre] = useState(initialNombre)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setNombre(initialNombre)
  }, [initialNombre, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
    if (!nextOpen) setNombre(initialNombre)
  }

  const handleCreate = async () => {
    const trimmedNombre = nombre.trim()
    if (!trimmedNombre) return
    setIsSaving(true)
    try {
      const success = await onCreate({ nombre: trimmedNombre })
      if (success) handleOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const formBody = (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="talla-create-nombre">Nombre</Label>
        <Input id="talla-create-nombre" placeholder="Ej. S, M, L, XL" maxLength={20} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="flex flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Nueva Talla</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-4">{formBody}</div>
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button type="button" className="flex-1" onClick={handleCreate} disabled={!nombre.trim() || isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Nueva Talla</DialogTitle>
          <DialogDescription>Completa los datos para crear una nueva talla.</DialogDescription>
        </DialogHeader>
        {formBody}
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
          <Button type="button" onClick={handleCreate} disabled={!nombre.trim() || isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
