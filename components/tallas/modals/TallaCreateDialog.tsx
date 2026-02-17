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
import type { TallaCreateRequest } from "@/lib/types/talla"

interface TallaCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: TallaCreateRequest) => Promise<boolean>
}

export function TallaCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: TallaCreateDialogProps) {
  const [nombre, setNombre] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setNombre("")
    }
  }

  const handleCreate = async () => {
    const trimmedNombre = nombre.trim()
    if (!trimmedNombre) return

    setIsSaving(true)
    try {
      const success = await onCreate({ nombre: trimmedNombre })
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
          <DialogTitle>Nueva Talla</DialogTitle>
          <DialogDescription>
            Completa los datos para crear una nueva talla.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="talla-create-nombre">Nombre</Label>
            <Input
              id="talla-create-nombre"
              placeholder="Ej. S, M, L, XL"
              maxLength={20}
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleCreate} disabled={isSaving || !nombre.trim()}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
