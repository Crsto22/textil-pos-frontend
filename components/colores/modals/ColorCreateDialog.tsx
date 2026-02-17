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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { normalizeHex, toPickerColor } from "@/components/colores/colores.utils"
import type { ColorCreateRequest } from "@/lib/types/color"

interface ColorCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: ColorCreateRequest) => Promise<boolean>
}

export function ColorCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: ColorCreateDialogProps) {
  const [nombre, setNombre] = useState("")
  const [codigo, setCodigo] = useState("#000000")
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setNombre("")
      setCodigo("#000000")
    }
  }

  const handleCreate = async () => {
    const trimmedNombre = nombre.trim()
    const normalizedCodigo = normalizeHex(codigo)
    if (!trimmedNombre || !normalizedCodigo) return

    setIsSaving(true)
    try {
      const success = await onCreate({
        nombre: trimmedNombre,
        codigo: normalizedCodigo,
      })
      if (success) {
        handleOpenChange(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Nuevo Color</DialogTitle>
          <DialogDescription>
            Completa los datos para crear un nuevo color.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="color-create-nombre">Nombre</Label>
            <Input
              id="color-create-nombre"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej. Azul Marino"
              maxLength={50}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="color-create-codigo">Codigo HEX</Label>
            <div className="flex items-center gap-3">
              <Input
                id="color-create-codigo"
                value={codigo}
                onChange={(event) => setCodigo(event.target.value.toUpperCase())}
                placeholder="#001F5B"
                maxLength={7}
              />
              <input
                type="color"
                value={toPickerColor(codigo)}
                onChange={(event) => setCodigo(event.target.value.toUpperCase())}
                className="h-10 w-12 cursor-pointer rounded-md border bg-transparent p-1"
                aria-label="Selector de color"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isSaving || !nombre.trim() || !codigo.trim()}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
