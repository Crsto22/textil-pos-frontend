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
  emptyUpdateForm,
  getSucursalTipoFilterByRol,
  getUsuarioRoleOptionsBySucursalType,
  isUsuarioRol,
  normalizeUsuarioRol,
  validateUsuarioRoleAssignment,
  type Usuario,
  type UsuarioUpdateFormState,
  type UsuarioUpdateRequest,
} from "@/lib/types/usuario"

interface UsuarioEditDialogProps {
  open: boolean
  user: Usuario | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: UsuarioUpdateRequest) => Promise<boolean>
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

export function UsuarioEditDialog({
  open,
  user,
  onOpenChange,
  onUpdate,
}: UsuarioEditDialogProps) {
  const [form, setForm] = useState<UsuarioUpdateFormState>(emptyUpdateForm)
  const [isUpdating, setIsUpdating] = useState(false)

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
    getTurnoOptionById,
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

    const selectedSucursal = getSucursalById(Number(form.idSucursal))
    if (selectedSucursal) return selectedSucursal.tipo

    if (user?.idSucursal === Number(form.idSucursal)) {
      return user.tipoSucursal
    }

    return null
  }, [form.idSucursal, getSucursalById, hasValidSucursal, user])

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
            ? [getSucursalOptionById(Number(form.idSucursal), user?.nombreSucursal)]
            : []
        ),
        ...filteredSucursalOptions,
      ],
    [
      form.idSucursal,
      getSucursalOptionById,
      hasValidSucursal,
      filteredSucursalOptions,
      user?.nombreSucursal,
    ]
  )
  const turnoComboboxOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: "", label: "Sin turno" },
      ...(
        typeof form.idTurno === "number" &&
        form.idTurno > 0 &&
        !turnoOptions.some((option) => option.value === String(form.idTurno))
          ? [getTurnoOptionById(form.idTurno, user?.nombreTurno)]
          : []
      ),
      ...turnoOptions,
    ],
    [form.idTurno, getTurnoOptionById, turnoOptions, user?.nombreTurno]
  )

  useEffect(() => {
    if (!open || !user) return

    const initialRole = normalizeUsuarioRol(user.rol)
    const initialBranchId =
      initialRole === "ADMINISTRADOR" ? null : user.idSucursal

    const initialIdsSucursales =
      user.sucursalesPermitidas
        ?.map((s) => s.idSucursal)
        .filter((id) => id !== initialBranchId) ?? []

    setForm({
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      telefono: user.telefono,
      correo: user.correo,
      rol: initialRole,
      estado: user.estado,
      idSucursal: initialBranchId,
      idsSucursales: initialIdsSucursales,
      idTurno: user.idTurno,
    })
    setSearchSucursal("")
    setSearchSucursalesAdicionales("")
    setSearchTurno("")
  }, [open, setSearchSucursal, setSearchTurno, user])

  const showSucursalField = form.rol !== "" && form.rol !== "ADMINISTRADOR"

  const isEditValid = useMemo(
    () =>
      form.nombre.trim() !== "" &&
      form.apellido.trim() !== "" &&
      form.dni.length === 8 &&
      form.telefono.length === 9 &&
      form.correo.trim() !== "" &&
      validation.isValid,
    [form, validation.isValid]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(emptyUpdateForm)
      setSearchSucursal("")
      setSearchSucursalesAdicionales("")
      setSearchTurno("")
    }
  }

  const handleUpdate = async () => {
    if (!user || !isEditValid || !isUsuarioRol(form.rol)) return

    const payload: UsuarioUpdateRequest = {
      ...form,
      rol: form.rol,
      idSucursal: form.rol === "ADMINISTRADOR" ? null : form.idSucursal,
      idsSucursales: form.rol === "ADMINISTRADOR" ? null : (form.idsSucursales ?? []),
      idTurno: form.idTurno,
    }

    setIsUpdating(true)
    try {
      const success = await onUpdate(user.idUsuario, payload)
      if (success) handleOpenChange(false)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[740px] max-h-[90vh] overflow-y-auto">
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, nombre: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="e-apellido">Apellido</Label>
              <Input
                id="e-apellido"
                value={form.apellido}
                onChange={(e) =>
                  setForm((p) => ({ ...p, apellido: e.target.value }))
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
              <Label htmlFor="e-telefono">Telefono</Label>
              <Input
                id="e-telefono"
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
            <Label htmlFor="e-correo">Correo</Label>
            <Input
              id="e-correo"
              type="email"
              value={form.correo}
              onChange={(e) =>
                setForm((p) => ({ ...p, correo: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="e-turno">Turno</Label>
            <Combobox
              id="e-turno"
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
                  id="e-estado"
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
              <Label htmlFor="e-sucursal">Sucursal principal</Label>
              <Combobox
                id="e-sucursal"
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
            onClick={handleUpdate}
            disabled={!isEditValid || isUpdating}
          >
            {isUpdating ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
