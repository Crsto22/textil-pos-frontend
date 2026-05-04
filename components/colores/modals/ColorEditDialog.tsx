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
import type { Color, ColorUpdateRequest } from "@/lib/types/color"

interface ColorEditDialogProps {
  open: boolean
  color: Color | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: ColorUpdateRequest) => Promise<boolean>
}

export function ColorEditDialog({ open, color, onOpenChange, onUpdate }: ColorEditDialogProps) {
  const isMobile = useIsMobile()
  const [nombre, setNombre] = useState("")
  const [codigo, setCodigo] = useState("#000000")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!open || !color) return
    setNombre(color.nombre)
    setCodigo(normalizeHex(color.codigo) || "#000000")
  }, [open, color])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isUpdating) return
    onOpenChange(nextOpen)
    if (!nextOpen) { setNombre(""); setCodigo("#000000") }
  }

  const handleUpdate = async () => {
    if (!color) return
    const trimmedNombre = nombre.trim()
    const normalizedCodigo = normalizeHex(codigo)
    if (!trimmedNombre || !normalizedCodigo) return
    setIsUpdating(true)
    try {
      const success = await onUpdate(color.idColor, { nombre: trimmedNombre, codigo: normalizedCodigo })
      if (success) handleOpenChange(false)
    } finally {
      setIsUpdating(false)
    }
  }

  const isValid = !!nombre.trim() && !!codigo.trim()

  const formBody = (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="color-edit-nombre">Nombre</Label>
        <Input id="color-edit-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Azul Marino" maxLength={50} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="color-edit-codigo">Codigo HEX</Label>
        <div className="flex items-center gap-3">
          <Input id="color-edit-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="#001F5B" maxLength={7} />
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
            <SheetTitle className="text-sm">Editar Color</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-4">{formBody}</div>
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={isUpdating} onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button type="button" className="flex-1" onClick={handleUpdate} disabled={!isValid || isUpdating}>{isUpdating ? "Guardando..." : "Guardar cambios"}</Button>
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
          <DialogTitle>Editar Color</DialogTitle>
          <DialogDescription>{`Actualiza los datos del color "${color?.nombre ?? ""}".`}</DialogDescription>
        </DialogHeader>
        {formBody}
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" disabled={isUpdating}>Cancelar</Button></DialogClose>
          <Button type="button" onClick={handleUpdate} disabled={!isValid || isUpdating}>{isUpdating ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
