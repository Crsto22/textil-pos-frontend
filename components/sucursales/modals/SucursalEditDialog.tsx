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
import { Switch } from "@/components/ui/switch"
import { useEmpresaOptions } from "@/lib/hooks/useEmpresaOptions"
import {
  emptyUpdate,
  type Sucursal,
  type SucursalUpdateRequest,
  type TipoSucursal,
} from "@/lib/types/sucursal"

interface SucursalEditDialogProps {
  open: boolean
  sucursal: Sucursal | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: SucursalUpdateRequest) => Promise<boolean>
}

const phoneRegex = /^\d{7,15}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const codigoSunatRegex = /^\d{4}$/

export function SucursalEditDialog({
  open,
  sucursal,
  onOpenChange,
  onUpdate,
}: SucursalEditDialogProps) {
  const [form, setForm] = useState<SucursalUpdateRequest>(emptyUpdate)
  const [isUpdating, setIsUpdating] = useState(false)
  const { empresas, loadingEmpresas, errorEmpresas, fetchEmpresas } =
    useEmpresaOptions(open)

  useEffect(() => {
    if (!open || !sucursal) return

    const ubigeo = sucursal.ubigeo ?? ""
    setForm({
      nombre: sucursal.nombre,
      ciudad: sucursal.ciudad,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      correo: sucursal.correo,
      tipo: sucursal.tipo,
      estado: sucursal.estado,
      ubigeo,
      codigoEstablecimientoSunat: sucursal.codigoEstablecimientoSunat ?? "",
      idEmpresa: sucursal.idEmpresa,
    })
  }, [open, sucursal])

  useEffect(() => {
    if (!open || empresas.length === 0) return

    setForm((previous) => {
      const existsInList = empresas.some(
        (empresa) => empresa.idEmpresa === previous.idEmpresa
      )
      if (existsInList) return previous
      return { ...previous, idEmpresa: empresas[0].idEmpresa }
    })
  }, [empresas, open])

  const hasEmpresaSeleccionada = useMemo(
    () => empresas.some((empresa) => empresa.idEmpresa === form.idEmpresa),
    [empresas, form.idEmpresa]
  )
  const telefono = form.telefono ?? ""
  const correo = form.correo ?? ""
  const codigoCodigo = form.codigoEstablecimientoSunat ?? ""

  const isEditValid = useMemo(
    () =>
      form.nombre.trim() !== "" &&
      form.ciudad.trim() !== "" &&
      form.direccion.trim() !== "" &&
      (form.ubigeo ?? "").length === 6 &&
      (telefono === "" || phoneRegex.test(telefono)) &&
      (correo === "" || emailRegex.test(correo)) &&
      (codigoCodigo === "" || codigoSunatRegex.test(codigoCodigo)) &&
      Number.isInteger(form.idEmpresa) &&
      form.idEmpresa > 0 &&
      hasEmpresaSeleccionada,
    [correo, codigoCodigo, form, hasEmpresaSeleccionada, telefono]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(emptyUpdate)
    }
  }

  const handleUpdate = async () => {
    if (!sucursal) return

    setIsUpdating(true)
    try {
      const success = await onUpdate(sucursal.idSucursal, form)
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
          <DialogTitle>Editar Sucursal</DialogTitle>
          <DialogDescription>
            Modifica los datos de la sucursal seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="e-nombre-sucursal">Nombre</Label>
            <Input
              id="e-nombre-sucursal"
              value={form.nombre}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  nombre: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="e-ciudad-sucursal">Ciudad</Label>
              <Input
                id="e-ciudad-sucursal"
                placeholder="Lima"
                value={form.ciudad}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    ciudad: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e-direccion-sucursal">Direccion</Label>
              <Input
                id="e-direccion-sucursal"
                placeholder="Jr. Gamarra 1234, La Victoria"
                value={form.direccion}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    direccion: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="e-telefono-sucursal">
                Telefono <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="e-telefono-sucursal"
                maxLength={15}
                value={telefono}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    telefono: event.target.value.replace(/\D/g, "").slice(0, 15),
                  }))
                }
              />
              {telefono.length > 0 && !phoneRegex.test(telefono) && (
                <p className="text-xs text-red-500">Debe tener entre 7 y 15 digitos</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e-correo-sucursal">
                Correo <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="e-correo-sucursal"
                type="email"
                value={correo}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    correo: event.target.value,
                  }))
                }
              />
              {correo.length > 0 && !emailRegex.test(correo) && (
                <p className="text-xs text-red-500">Formato de correo invalido</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="e-ubigeo-sucursal">Ubigeo</Label>
              <Input
                id="e-ubigeo-sucursal"
                placeholder="Ej: 150131"
                maxLength={6}
                value={form.ubigeo ?? ""}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    ubigeo: event.target.value.replace(/\D/g, "").slice(0, 6),
                  }))
                }
              />
              {(form.ubigeo?.length ?? 0) > 0 && (form.ubigeo?.length ?? 0) !== 6 && (
                <p className="text-xs text-red-500">El ubigeo debe tener exactamente 6 digitos</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e-codigo-sunat-sucursal">
                Cod. Establecimiento SUNAT <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="e-codigo-sunat-sucursal"
                placeholder="Ej: 0001"
                maxLength={4}
                value={codigoCodigo}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    codigoEstablecimientoSunat: event.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
              />
              {codigoCodigo.length > 0 && !codigoSunatRegex.test(codigoCodigo) && (
                <p className="text-xs text-red-500">Debe tener exactamente 4 digitos</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="e-tipo-sucursal">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    tipo: value as TipoSucursal,
                  }))
                }
              >
                <SelectTrigger className="w-full" id="e-tipo-sucursal">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENTA">Venta</SelectItem>
                  <SelectItem value="ALMACEN">Almacen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e-empresa-sucursal">Empresa</Label>
              {loadingEmpresas ? (
                <Input id="e-empresa-sucursal" value="Cargando empresas..." disabled />
              ) : errorEmpresas ? (
                <div className="space-y-2">
                  <Input
                    id="e-empresa-sucursal"
                    value="No se pudieron cargar las empresas"
                    disabled
                  />
                  <button
                    type="button"
                    onClick={() => void fetchEmpresas()}
                    className="text-xs text-blue-600 underline hover:no-underline"
                  >
                    Reintentar
                  </button>
                </div>
              ) : empresas.length <= 1 ? (
                <Input
                  id="e-empresa-sucursal"
                  value={empresas[0]?.nombre ?? "Sin empresa disponible"}
                  disabled
                />
              ) : (
                <Select
                  value={String(form.idEmpresa)}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      idEmpresa: Number(value),
                    }))
                  }
                >
                  <SelectTrigger className="w-full" id="e-empresa-sucursal">
                    <SelectValue placeholder="Selecciona empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.idEmpresa} value={String(empresa.idEmpresa)}>
                        {empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="e-estado-sucursal">Estado</Label>
            <div className="flex h-9 items-center justify-between rounded-md border px-3">
              <span
                className={`text-sm font-medium ${
                  form.estado === "ACTIVO" ? "text-emerald-600" : "text-slate-500"
                }`}
              >
                {form.estado === "ACTIVO" ? "Activo" : "Inactivo"}
              </span>
              <Switch
                id="e-estado-sucursal"
                checked={form.estado === "ACTIVO"}
                onCheckedChange={(checked) =>
                  setForm((previous) => ({
                    ...previous,
                    estado: checked ? "ACTIVO" : "INACTIVO",
                  }))
                }
                aria-label="Cambiar estado de la sucursal"
              />
            </div>
          </div>
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
            disabled={!isEditValid || isUpdating || loadingEmpresas}
          >
            {isUpdating ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
