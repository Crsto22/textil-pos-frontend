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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  const buildInitialForm = useCallback(
    (): CategoriaCreateRequest => ({
      nombreCategoria: initialNombreCategoria,
      descripcion: initialDescripcion,
    }),
    [initialDescripcion, initialNombreCategoria]
  )

  const [form, setForm] = useState<CategoriaCreateRequest>(buildInitialForm)
  const [isSaving, setIsSaving] = useState(false)

  const isCreateValid = form.nombreCategoria.trim() !== ""

  useEffect(() => {
    if (!open) return
    setForm(buildInitialForm())
  }, [buildInitialForm, initialDescripcion, initialNombreCategoria, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(buildInitialForm())
    }
  }

  const handleCreate = async () => {
    if (!isCreateValid) return

    const payload: CategoriaCreateRequest = {
      nombreCategoria: form.nombreCategoria.trim(),
      descripcion: form.descripcion.trim(),
    }

    setIsSaving(true)
    try {
      const success = await onCreate(payload)
      if (success) {
        handleOpenChange(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Nueva Categoria</DialogTitle>
          <DialogDescription>
            Completa los datos para crear una nueva categoria.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="categoria-create-nombre">Nombre</Label>
            <Input
              id="categoria-create-nombre"
              placeholder="Ej. Polos"
              value={form.nombreCategoria}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  nombreCategoria: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoria-create-descripcion">Descripcion</Label>
            <Textarea
              id="categoria-create-descripcion"
              placeholder="Ej. Linea casual"
              rows={2}
              value={form.descripcion}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  descripcion: event.target.value,
                }))
              }
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleCreate} disabled={!isCreateValid || isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
