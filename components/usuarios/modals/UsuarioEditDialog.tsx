import { useEffect, useMemo, useState } from "react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  emptyUpdate,
  type Usuario,
  type UsuarioUpdateRequest,
} from "@/lib/types/usuario"

interface UsuarioEditDialogProps {
  open: boolean
  user: Usuario | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: UsuarioUpdateRequest) => Promise<boolean>
}

export function UsuarioEditDialog({
  open,
  user,
  onOpenChange,
  onUpdate,
}: UsuarioEditDialogProps) {
  const [form, setForm] = useState<UsuarioUpdateRequest>(emptyUpdate)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!open || !user) return

    setForm({
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      telefono: user.telefono,
      correo: user.correo,
      rol: user.rol,
      estado: user.estado,
      idSucursal: user.idSucursal,
    })
  }, [open, user])

  const isEditValid = useMemo(
    () =>
      form.nombre.trim() !== "" &&
      form.apellido.trim() !== "" &&
      form.dni.length === 8 &&
      form.telefono.length === 9 &&
      form.correo.trim() !== "",
    [form]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(emptyUpdate)
    }
  }

  const handleUpdate = async () => {
    if (!user) return

    setIsUpdating(true)
    try {
      const success = await onUpdate(user.idUsuario, form)
      if (success) {
        handleOpenChange(false)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica los datos del usuario seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="e-nombre">Nombre</Label>
              <Input
                id="e-nombre"
                value={form.nombre}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    nombre: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="e-apellido">Apellido</Label>
              <Input
                id="e-apellido"
                value={form.apellido}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    apellido: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="e-dni">DNI</Label>
              <Input
                id="e-dni"
                maxLength={8}
                value={form.dni}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    dni: event.target.value.replace(/\D/g, "").slice(0, 8),
                  }))
                }
              />
              {form.dni.length > 0 && form.dni.length < 8 && (
                <p className="text-xs text-red-500">
                  Debe tener 8 dígitos ({form.dni.length}/8)
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="e-telefono">Teléfono</Label>
              <Input
                id="e-telefono"
                maxLength={9}
                value={form.telefono}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    telefono: event.target.value.replace(/\D/g, "").slice(0, 9),
                  }))
                }
              />
              {form.telefono.length > 0 && form.telefono.length < 9 && (
                <p className="text-xs text-red-500">
                  Debe tener 9 dígitos ({form.telefono.length}/9)
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="e-correo">Correo</Label>
            <Input
              id="e-correo"
              type="email"
              value={form.correo}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, correo: event.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="e-rol">Rol</Label>
              <Select
                value={form.rol}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, rol: value }))
                }
              >
                <SelectTrigger className="w-full" id="e-rol">
                  <SelectValue placeholder="Selecciona rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                  <SelectItem value="VENTAS">Ventas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e-estado">Estado</Label>
              <Select
                value={form.estado}
                onValueChange={(value) =>
                  setForm((previous) => ({ ...previous, estado: value }))
                }
              >
                <SelectTrigger className="w-full" id="e-estado">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="e-sucursal">ID Sucursal</Label>
            <Input
              id="e-sucursal"
              type="number"
              min={1}
              value={form.idSucursal}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  idSucursal: Number(event.target.value),
                }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
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
