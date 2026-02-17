import { useMemo, useState } from "react"

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
  emptyCreate,
  isUsuarioRol,
  usuarioRolRequiresSucursal,
  USUARIO_ROLE_OPTIONS,
  type UsuarioCreateRequest,
} from "@/lib/types/usuario"

interface UsuarioCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: UsuarioCreateRequest) => Promise<boolean>
}

export function UsuarioCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: UsuarioCreateDialogProps) {
  const [form, setForm] = useState<UsuarioCreateRequest>(emptyCreate)
  const [isSaving, setIsSaving] = useState(false)
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
              label: `Sucursal #${form.idSucursal}`,
            },
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [form.idSucursal, hasValidSucursal, sucursalOptions]
  )

  const isCreateValid = useMemo(
    () =>
      form.nombre.trim() !== "" &&
      form.apellido.trim() !== "" &&
      form.dni.length === 8 &&
      form.telefono.length === 9 &&
      form.email.trim() !== "" &&
      form.password.length >= 8 &&
      isUsuarioRol(form.rol) &&
      (!requiresSucursal || hasValidSucursal),
    [form, hasValidSucursal, requiresSucursal]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(emptyCreate)
      setSearchSucursal("")
    }
  }

  const handleCreate = async () => {
    if (!isCreateValid) return

    const payload: UsuarioCreateRequest = {
      ...form,
      idSucursal: requiresSucursal ? form.idSucursal : null,
      ...(form.estado === "INACTIVO" ? { estado: "INACTIVO" } : {}),
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
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo usuario.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="c-nombre">Nombre</Label>
              <Input
                id="c-nombre"
                placeholder="Juan"
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
              <Label htmlFor="c-apellido">Apellido</Label>
              <Input
                id="c-apellido"
                placeholder="Pérez"
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
              <Label htmlFor="c-dni">DNI</Label>
              <Input
                id="c-dni"
                placeholder="12345678"
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
              <Label htmlFor="c-telefono">Teléfono</Label>
              <Input
                id="c-telefono"
                placeholder="987654321"
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
            <Label htmlFor="c-correo">Correo</Label>
            <Input
              id="c-correo"
              type="email"
              placeholder="usuario@email.com"
              value={form.email}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="c-password">Contraseña</Label>
            <Input
              id="c-password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  password: event.target.value,
                }))
              }
            />
            {form.password.length > 0 && form.password.length < 8 && (
              <p className="text-xs text-red-500">
                Debe tener al menos 8 caracteres ({form.password.length}/8)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="c-rol">Rol</Label>
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
                <SelectTrigger className="w-full" id="c-rol">
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
              <Label htmlFor="c-estado">Estado</Label>
              <div className="flex h-9 items-center justify-between rounded-md border px-3">
                <span
                  className={`text-sm font-medium ${
                    form.estado === "ACTIVO" ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {form.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                </span>
                <Switch
                  id="c-estado"
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
              <Label htmlFor="c-sucursal">Sucursal</Label>
              <Combobox
                id="c-sucursal"
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
          <Button type="button" onClick={handleCreate} disabled={!isCreateValid || isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
