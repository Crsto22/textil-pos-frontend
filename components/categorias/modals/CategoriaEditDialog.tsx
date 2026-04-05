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
import { Textarea } from "@/components/ui/textarea"
import type { Categoria, CategoriaUpdateRequest } from "@/lib/types/categoria"

interface CategoriaEditDialogProps {
  open: boolean
  categoria: Categoria | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: CategoriaUpdateRequest) => Promise<boolean>
}

export function CategoriaEditDialog({
  open,
  categoria,
  onOpenChange,
  onUpdate,
}: CategoriaEditDialogProps) {
  const [form, setForm] = useState<CategoriaUpdateRequest>({
    nombreCategoria: "",
    descripcion: "",
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!open || !categoria) return
    setForm({
      nombreCategoria: categoria.nombreCategoria,
      descripcion: categoria.descripcion ?? "",
    })
  }, [categoria, open])

  const isEditValid = form.nombreCategoria.trim() !== ""

  const handleOpenChange = (nextOpen: boolean) => {
    if (isUpdating) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm({
        nombreCategoria: "",
        descripcion: "",
      })
    }
  }

  const handleUpdate = async () => {
    if (!categoria || !isEditValid) return

    const payload: CategoriaUpdateRequest = {
      nombreCategoria: form.nombreCategoria.trim(),
      descripcion: form.descripcion.trim(),
    }

    setIsUpdating(true)
    try {
      const success = await onUpdate(categoria.idCategoria, payload)
      if (success) {
        handleOpenChange(false)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton={!isUpdating}>
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogDescription>
            Modifica los datos de la categoria seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="categoria-edit-nombre">Nombre</Label>
            <Input
              id="categoria-edit-nombre"
              value={form.nombreCategoria}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  nombreCategoria: event.target.value,
                }))
              }
              placeholder="Ej. Polos"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoria-edit-descripcion">Descripcion</Label>
            <Textarea
              id="categoria-edit-descripcion"
              value={form.descripcion}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  descripcion: event.target.value,
                }))
              }
              rows={2}
              placeholder="Ej. Linea actualizada"
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isUpdating}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleUpdate} disabled={!isEditValid || isUpdating}>
            {isUpdating ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
