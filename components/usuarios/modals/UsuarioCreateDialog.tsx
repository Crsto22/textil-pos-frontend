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
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SucursalMultiSelect } from "@/components/ui/sucursal-multi-select"
import { Switch } from "@/components/ui/switch"
import { RoleMasterDetail } from "@/components/usuarios/RoleMasterDetail"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useTurnoOptions } from "@/lib/hooks/useTurnoOptions"
import {
  emptyCreateForm,
  getSucursalTipoFilterByRol,
  getUsuarioRoleOptionsBySucursalType,
  isUsuarioRol,
  validateUsuarioRoleAssignment,
  type UsuarioCreateFormState,
  type UsuarioCreateRequest,
} from "@/lib/types/usuario"

interface UsuarioCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: UsuarioCreateRequest) => Promise<boolean>
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

export function UsuarioCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: UsuarioCreateDialogProps) {
  const [form, setForm] = useState<UsuarioCreateFormState>(emptyCreateForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(emptyCreateForm)
  }, [open])

  const {
    sucursales,
    sucursalOptions,
    getSucursalById,
    getSucursalOptionById,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(open)
  const {
    turnoOptions,
    loadingTurnos,
    errorTurnos,
    searchTurno,
    setSearchTurno,
  } = useTurnoOptions(open)

  const [searchSucursalesAdicionales, setSearchSucursalesAdicionales] = useState("")

  const sucursalTipoFilter = useMemo(
    () => getSucursalTipoFilterByRol(form.rol || null),
    [form.rol]
  )

  const sucursalesAdicionalesOptions = useMemo(() => {
    if (!sucursalTipoFilter) return sucursalOptions
    return (Array.isArray(sucursales) ? sucursales : [])
      .filter((sucursal) => sucursal.tipo === sucursalTipoFilter)
      .map((sucursal) => ({
        value: String(sucursal.idSucursal),
        label: sucursal.nombre || `Sucursal #${sucursal.idSucursal}`,
      }))
  }, [sucursales, sucursalOptions, sucursalTipoFilter])

  const hasValidSucursal = hasValidSucursalId(form.idSucursal)

  const selectedSucursalType = useMemo(() => {
    if (!hasValidSucursal) return null
    return getSucursalById(Number(form.idSucursal))?.tipo ?? null
  }, [form.idSucursal, getSucursalById, hasValidSucursal])

  const availableRoleOptions = useMemo(
    () => getUsuarioRoleOptionsBySucursalType(selectedSucursalType),
    [selectedSucursalType]
  )

  const validation = useMemo(
    () =>
      validateUsuarioRoleAssignment(
        form.rol,
        form.idSucursal,
        selectedSucursalType
      ),
    [form.idSucursal, form.rol, selectedSucursalType]
  )

  const filteredSucursalOptions = useMemo(() => {
    if (!sucursalTipoFilter) return sucursalOptions
    return (Array.isArray(sucursales) ? sucursales : [])
      .filter((sucursal) => sucursal.tipo === sucursalTipoFilter)
      .map((sucursal) => ({
        value: String(sucursal.idSucursal),
        label: sucursal.nombre || `Sucursal #${sucursal.idSucursal}`,
      }))
  }, [sucursales, sucursalOptions, sucursalTipoFilter])

  const comboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      [
        { value: "", label: "Sin sucursal" },
        ...(
          hasValidSucursal &&
          !filteredSucursalOptions.some((option) => option.value === String(form.idSucursal))
            ? [getSucursalOptionById(Number(form.idSucursal))]
            : []
        ),
        ...filteredSucursalOptions,
      ],
    [form.idSucursal, getSucursalOptionById, hasValidSucursal, filteredSucursalOptions]
  )
  const turnoComboboxOptions = useMemo<ComboboxOption[]>(
    () => [{ value: "", label: "Sin turno" }, ...turnoOptions],
    [turnoOptions]
  )

  const showSucursalField = form.rol !== "" && form.rol !== "ADMINISTRADOR"

  const isCreateValid = useMemo(
    () =>
      form.nombre.trim() !== "" &&
      form.apellido.trim() !== "" &&
      form.dni.length === 8 &&
      form.telefono.length === 9 &&
      form.email.trim() !== "" &&
      form.password.length >= 8 &&
      validation.isValid,
    [form, validation.isValid]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(emptyCreateForm)
      setSearchSucursal("")
      setSearchSucursalesAdicionales("")
      setSearchTurno("")
    }
  }

  const handleCreate = async () => {
    if (!isCreateValid || !isUsuarioRol(form.rol)) return

    const payload: UsuarioCreateRequest = {
      ...form,
      rol: form.rol,
      idSucursal: form.rol === "ADMINISTRADOR" ? null : form.idSucursal,
      idsSucursales: form.rol === "ADMINISTRADOR" ? null : (form.idsSucursales ?? []),
      idTurno: form.idTurno,
      ...(form.estado === "INACTIVO" ? { estado: "INACTIVO" } : {}),
    }

    setIsSaving(true)
    try {
      const success = await onCreate(payload)
      if (success) handleOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[740px] max-h-[90vh] overflow-y-auto">
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, nombre: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-apellido">Apellido</Label>
              <Input
                id="c-apellido"
                placeholder="Perez"
                value={form.apellido}
                onChange={(e) =>
                  setForm((p) => ({ ...p, apellido: e.target.value }))
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
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    dni: e.target.value.replace(/\D/g, "").slice(0, 8),
                  }))
                }
              />
              {form.dni.length > 0 && form.dni.length < 8 ? (
                <p className="text-xs text-red-500">
                  Debe tener 8 digitos ({form.dni.length}/8)
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-telefono">Telefono</Label>
              <Input
                id="c-telefono"
                placeholder="987654321"
                maxLength={9}
                value={form.telefono}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    telefono: e.target.value.replace(/\D/g, "").slice(0, 9),
                  }))
                }
              />
              {form.telefono.length > 0 && form.telefono.length < 9 ? (
                <p className="text-xs text-red-500">
                  Debe tener 9 digitos ({form.telefono.length}/9)
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="c-correo">Correo</Label>
            <Input
              id="c-correo"
              type="email"
              placeholder="usuario@email.com"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="c-password">Contrasena</Label>
            <Input
              id="c-password"
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
            />
            {form.password.length > 0 && form.password.length < 8 ? (
              <p className="text-xs text-red-500">
                Debe tener al menos 8 caracteres ({form.password.length}/8)
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="c-turno">Turno</Label>
            <Combobox
              id="c-turno"
              value={typeof form.idTurno === "number" ? String(form.idTurno) : ""}
              options={turnoComboboxOptions}
              searchValue={searchTurno}
              onSearchValueChange={setSearchTurno}
              onValueChange={(value) => {
                const parsed = Number(value)
                setForm((previous) => ({
                  ...previous,
                  idTurno: Number.isInteger(parsed) && parsed > 0 ? parsed : null,
                }))
              }}
              placeholder="Selecciona un turno"
              searchPlaceholder="Buscar turno..."
              emptyMessage="No se encontraron turnos"
              loading={loadingTurnos}
            />
            {errorTurnos ? <p className="text-xs text-red-500">{errorTurnos}</p> : null}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Rol y permisos</Label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    form.estado === "ACTIVO" ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {form.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                </span>
                <Switch
                  id="c-estado"
                  checked={form.estado === "ACTIVO"}
                  onCheckedChange={(checked) =>
                    setForm((p) => ({
                      ...p,
                      estado: checked ? "ACTIVO" : "INACTIVO",
                    }))
                  }
                  aria-label="Cambiar estado del usuario"
                />
              </div>
            </div>

            <RoleMasterDetail
              availableRoles={availableRoleOptions}
              selectedRol={form.rol}
              onSelect={(value) => {
                if (!isUsuarioRol(value)) return
                setForm((p) => ({
                  ...p,
                  rol: value,
                  idSucursal: value === "ADMINISTRADOR" ? null : p.idSucursal,
                }))
              }}
            />

            {validation.rolError && form.rol !== "" ? (
              <p className="text-xs text-red-500">{validation.rolError}</p>
            ) : null}
          </div>

          {showSucursalField ? (
            <div className="grid gap-2">
              <Label htmlFor="c-sucursal">Sucursal principal</Label>
              <Combobox
                id="c-sucursal"
                value={hasValidSucursal ? String(form.idSucursal) : ""}
                options={comboboxOptions}
                searchValue={searchSucursal}
                onSearchValueChange={setSearchSucursal}
                onValueChange={(value) => {
                  const parsed = Number(value)
                  const resolvedId =
                    Number.isInteger(parsed) && parsed > 0 ? parsed : null

                  setForm((p) => ({
                    ...p,
                    idSucursal: resolvedId,
                    idsSucursales: resolvedId
                      ? (p.idsSucursales ?? []).filter((id) => id !== resolvedId)
                      : p.idsSucursales,
                  }))
                }}
                placeholder="Selecciona una sucursal"
                searchPlaceholder="Buscar sucursal..."
                emptyMessage="No se encontraron sucursales"
                loading={loadingSucursales}
              />

              {validation.sucursalError ? (
                <p className="text-xs text-red-500">{validation.sucursalError}</p>
              ) : null}
              {errorSucursales ? (
                <p className="text-xs text-red-500">{errorSucursales}</p>
              ) : null}
            </div>
          ) : form.rol === "ADMINISTRADOR" ? (
            <p className="text-xs text-muted-foreground">
              El rol Administrador no requiere sucursal y se guardara sin
              sucursal asignada.
            </p>
          ) : null}

          {showSucursalField && hasValidSucursal ? (
            <div className="grid gap-2">
              <Label>Sucursales adicionales</Label>
              <SucursalMultiSelect
                options={sucursalesAdicionalesOptions}
                selectedIds={form.idsSucursales ?? []}
                onSelectionChange={(ids) =>
                  setForm((p) => ({ ...p, idsSucursales: ids }))
                }
                searchValue={searchSucursalesAdicionales}
                onSearchValueChange={setSearchSucursalesAdicionales}
                placeholder="Seleccionar sucursales adicionales..."
                searchPlaceholder="Buscar sucursal..."
                emptyMessage={
                  sucursalTipoFilter === "VENTA"
                    ? "No se encontraron sucursales de tipo Venta"
                    : "No se encontraron sucursales"
                }
                loading={loadingSucursales}
                excludeIds={form.idSucursal ? [form.idSucursal] : []}
              />
              <p className="text-xs text-muted-foreground">
                {sucursalTipoFilter === "VENTA"
                  ? "Solo se muestran sucursales de tipo Venta para el rol Ventas."
                  : "Estas sucursales se suman a la principal para dar acceso al usuario."}
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!isCreateValid || isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
