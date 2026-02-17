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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Talla, TallaUpdateRequest } from "@/lib/types/talla"

interface TallaEditDialogProps {
  open: boolean
  talla: Talla | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: TallaUpdateRequest) => Promise<boolean>
}

export function TallaEditDialog({
  open,
  talla,
  onOpenChange,
  onUpdate,
}: TallaEditDialogProps) {
  const [nombre, setNombre] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!open || !talla) return
    setNombre(talla.nombre)
  }, [open, talla])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isUpdating) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setNombre("")
    }
  }

  const handleUpdate = async () => {
    if (!talla) return
    const trimmedNombre = nombre.trim()
    if (!trimmedNombre) return

    setIsUpdating(true)
    try {
      const success = await onUpdate(talla.idTalla, { nombre: trimmedNombre })
      if (success) {
        handleOpenChange(false)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]" showCloseButton={!isUpdating}>
        <DialogHeader>
          <DialogTitle>Editar Talla</DialogTitle>
          <DialogDescription>
            {`Actualiza el nombre de la talla "${talla?.nombre ?? ""}".`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="talla-edit-nombre">Nombre</Label>
            <Input
              id="talla-edit-nombre"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              maxLength={20}
              placeholder="Ej. XL"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isUpdating}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleUpdate} disabled={isUpdating || !nombre.trim()}>
            {isUpdating ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
