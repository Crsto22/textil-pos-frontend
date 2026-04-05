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
import { useEmpresaOptions } from "@/lib/hooks/useEmpresaOptions"
import {
  emptyCreate,
  type SucursalCreateRequest,
  type TipoSucursal,
} from "@/lib/types/sucursal"

interface SucursalCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: SucursalCreateRequest) => Promise<boolean>
}

const phoneRegex = /^\d{7,15}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SucursalCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: SucursalCreateDialogProps) {
  const [form, setForm] = useState<SucursalCreateRequest>(emptyCreate)
  const [isSaving, setIsSaving] = useState(false)
  const { empresas, loadingEmpresas, errorEmpresas, fetchEmpresas } =
    useEmpresaOptions(open)

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

  const isCreateValid = useMemo(
    () =>
      form.nombre.trim() !== "" &&
      form.ciudad.trim() !== "" &&
      form.direccion.trim() !== "" &&
      (telefono === "" || phoneRegex.test(telefono)) &&
      (correo === "" || emailRegex.test(correo)) &&
      Number.isInteger(form.idEmpresa) &&
      form.idEmpresa > 0 &&
      hasEmpresaSeleccionada,
    [correo, form, hasEmpresaSeleccionada, telefono]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm(emptyCreate)
    }
  }

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      const success = await onCreate(form)
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
          <DialogTitle>Nueva Sucursal</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar una nueva sucursal.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="c-nombre-sucursal">Nombre</Label>
            <Input
              id="c-nombre-sucursal"
              placeholder="Sucursal Gamarra"
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
              <Label htmlFor="c-ciudad-sucursal">Ciudad</Label>
              <Input
                id="c-ciudad-sucursal"
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
              <Label htmlFor="c-direccion-sucursal">Direccion</Label>
              <Input
                id="c-direccion-sucursal"
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
              <Label htmlFor="c-telefono-sucursal">
                Telefono <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="c-telefono-sucursal"
                placeholder="014567890"
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
              <Label htmlFor="c-correo-sucursal">
                Correo <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="c-correo-sucursal"
                type="email"
                placeholder="gamarra@kimets.pe"
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
              <Label htmlFor="c-tipo-sucursal">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    tipo: value as TipoSucursal,
                  }))
                }
              >
                <SelectTrigger className="w-full" id="c-tipo-sucursal">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENTA">Venta</SelectItem>
                  <SelectItem value="ALMACEN">Almacen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="c-empresa-sucursal">Empresa</Label>
              {loadingEmpresas ? (
                <Input id="c-empresa-sucursal" value="Cargando empresas..." disabled />
              ) : errorEmpresas ? (
                <div className="space-y-2">
                  <Input
                    id="c-empresa-sucursal"
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
                  id="c-empresa-sucursal"
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
                  <SelectTrigger className="w-full" id="c-empresa-sucursal">
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
            disabled={!isCreateValid || isSaving || loadingEmpresas}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
