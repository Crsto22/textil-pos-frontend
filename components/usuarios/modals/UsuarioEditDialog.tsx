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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import {
  emptyUpdate,
  isUsuarioRol,
  normalizeUsuarioRol,
  usuarioRolRequiresSucursal,
  USUARIO_ROLE_OPTIONS,
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
  const {
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(open)

  const requiresSucursal = usuarioRolRequiresSucursal(form.rol)
  const hasValidSucursal =
    typeof form.idSucursal === "number" && form.idSucursal > 0

  const comboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      hasValidSucursal &&
      !sucursalOptions.some((option) => option.value === String(form.idSucursal))
        ? [
            {
              value: String(form.idSucursal),
              label: user?.nombreSucursal || `Sucursal #${form.idSucursal}`,
            },
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [form.idSucursal, hasValidSucursal, sucursalOptions, user?.nombreSucursal]
  )

  useEffect(() => {
    if (!open || !user) return

    setForm({
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      telefono: user.telefono,
      correo: user.correo,
      rol: normalizeUsuarioRol(user.rol),
      estado: user.estado,
      idSucursal: user.idSucursal,
    })
    setSearchSucursal("")
  }, [open, setSearchSucursal, user])

  const isEditValid = useMemo(
    () =>
      form.nombre.trim() !== "" &&
      form.apellido.trim() !== "" &&
      form.dni.length === 8 &&
      form.telefono.length === 9 &&
      form.correo.trim() !== "" &&
      isUsuarioRol(form.rol) &&
      (!requiresSucursal || hasValidSucursal),
    [form, hasValidSucursal, requiresSucursal]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(emptyUpdate)
      setSearchSucursal("")
    }
  }

  const handleUpdate = async () => {
    if (!user || !isEditValid) return

    const payload: UsuarioUpdateRequest = {
      ...form,
      idSucursal: requiresSucursal ? form.idSucursal : null,
    }

    setIsUpdating(true)
    try {
      const success = await onUpdate(user.idUsuario, payload)
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
                  setForm((previous) => {
                    if (!isUsuarioRol(value)) return previous
                    return {
                      ...previous,
                      rol: value,
                      idSucursal: usuarioRolRequiresSucursal(value)
                        ? previous.idSucursal
                        : null,
                    }
                  })
                }
              >
                <SelectTrigger className="w-full" id="e-rol">
                  <SelectValue placeholder="Selecciona rol" />
                </SelectTrigger>
                <SelectContent>
                  {USUARIO_ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e-estado">Estado</Label>
              <div className="flex h-9 items-center justify-between rounded-md border px-3">
                <span
                  className={`text-sm font-medium ${
                    form.estado === "ACTIVO" ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {form.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                </span>
                <Switch
                  id="e-estado"
                  checked={form.estado === "ACTIVO"}
                  onCheckedChange={(checked) =>
                    setForm((previous) => ({
                      ...previous,
                      estado: checked ? "ACTIVO" : "INACTIVO",
                    }))
                  }
                  aria-label="Cambiar estado del usuario"
                />
              </div>
            </div>
          </div>

          {requiresSucursal ? (
            <div className="grid gap-2">
              <Label htmlFor="e-sucursal">Sucursal</Label>
              <Combobox
                id="e-sucursal"
                value={hasValidSucursal ? String(form.idSucursal) : ""}
                options={comboboxOptions}
                searchValue={searchSucursal}
                onSearchValueChange={setSearchSucursal}
                onValueChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    idSucursal: Number(value),
                  }))
                }
                placeholder="Selecciona una sucursal"
                searchPlaceholder="Buscar sucursal..."
                emptyMessage="No se encontraron sucursales"
                loading={loadingSucursales}
              />
              {errorSucursales && (
                <p className="text-xs text-red-500">{errorSucursales}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              El rol Administrador no requiere sucursal.
            </p>
          )}
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
