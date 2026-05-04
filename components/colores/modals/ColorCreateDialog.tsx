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
import { normalizeHex, toPickerColor } from "@/components/colores/colores.utils"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import type { ColorCreateRequest } from "@/lib/types/color"

interface ColorCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: ColorCreateRequest) => Promise<boolean>
  initialNombre?: string
  initialCodigo?: string
}

export function ColorCreateDialog({
  open,
  onOpenChange,
  onCreate,
  initialNombre = "",
  initialCodigo = "#000000",
}: ColorCreateDialogProps) {
  const isMobile = useIsMobile()
  const [nombre, setNombre] = useState(initialNombre)
  const [codigo, setCodigo] = useState(initialCodigo)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setNombre(initialNombre)
    setCodigo(initialCodigo)
  }, [initialCodigo, initialNombre, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setNombre(initialNombre)
      setCodigo(initialCodigo)
    }
  }

  const handleCreate = async () => {
    const trimmedNombre = nombre.trim()
    const normalizedCodigo = normalizeHex(codigo)
    if (!trimmedNombre || !normalizedCodigo) return
    setIsSaving(true)
    try {
      const success = await onCreate({ nombre: trimmedNombre, codigo: normalizedCodigo })
      if (success) handleOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const isValid = !!nombre.trim() && !!codigo.trim()

  const formBody = (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="color-create-nombre">Nombre</Label>
        <Input id="color-create-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Azul Marino" maxLength={50} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="color-create-codigo">Codigo HEX</Label>
        <div className="flex items-center gap-3">
          <Input id="color-create-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="#001F5B" maxLength={7} />
          <input type="color" value={toPickerColor(codigo)} onChange={(e) => setCodigo(e.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-md border bg-transparent p-1" aria-label="Selector de color" />
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="flex flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Nuevo Color</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-4">{formBody}</div>
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button type="button" className="flex-1" onClick={handleCreate} disabled={!isValid || isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
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
          <DialogTitle>Nuevo Color</DialogTitle>
          <DialogDescription>Completa los datos para crear un nuevo color.</DialogDescription>
        </DialogHeader>
        {formBody}
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
          <Button type="button" onClick={handleCreate} disabled={!isValid || isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
