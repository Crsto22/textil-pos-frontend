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
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/auth-context"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { Categoria, CategoriaUpdateRequest } from "@/lib/types/categoria"

interface CategoriaEditDialogProps {
  open: boolean
  categoria: Categoria | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: CategoriaUpdateRequest) => Promise<boolean>
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

export function CategoriaEditDialog({
  open,
  categoria,
  onOpenChange,
  onUpdate,
}: CategoriaEditDialogProps) {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)

  const [form, setForm] = useState<CategoriaUpdateRequest>({
    nombreCategoria: "",
    descripcion: "",
    idSucursal: null,
  })
  const [isUpdating, setIsUpdating] = useState(false)

  const {
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(open && isAdmin)

  const hasValidSucursal = hasValidSucursalId(form.idSucursal)

  const comboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      hasValidSucursal &&
      !sucursalOptions.some((option) => option.value === String(form.idSucursal))
        ? [
            {
              value: String(form.idSucursal),
              label: categoria?.nombreSucursal || `Sucursal #${form.idSucursal}`,
            },
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [categoria?.nombreSucursal, form.idSucursal, hasValidSucursal, sucursalOptions]
  )

  useEffect(() => {
    if (!open || !categoria) return
    setForm({
      nombreCategoria: categoria.nombreCategoria,
      descripcion: categoria.descripcion ?? "",
      idSucursal: isAdmin ? categoria.idSucursal : user?.idSucursal ?? null,
    })
    setSearchSucursal("")
  }, [categoria, isAdmin, open, setSearchSucursal, user?.idSucursal])

  const isEditValid =
    form.nombreCategoria.trim() !== "" && (!isAdmin || hasValidSucursal)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isUpdating) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm({
        nombreCategoria: "",
        descripcion: "",
        idSucursal: null,
      })
      setSearchSucursal("")
    }
  }

  const handleUpdate = async () => {
    if (!categoria || !isEditValid) return

    const payload: CategoriaUpdateRequest = isAdmin
      ? {
          nombreCategoria: form.nombreCategoria.trim(),
          descripcion: form.descripcion.trim(),
          ...(hasValidSucursal ? { idSucursal: form.idSucursal } : {}),
        }
      : {
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

          <div className="grid gap-2">
            <Label htmlFor="categoria-edit-sucursal">Sucursal</Label>
            {isAdmin ? (
              <>
                <Combobox
                  id="categoria-edit-sucursal"
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
                  placeholder="Selecciona sucursal"
                  searchPlaceholder="Buscar sucursal..."
                  emptyMessage="No se encontraron sucursales"
                  loading={loadingSucursales}
                />
                {errorSucursales && (
                  <p className="text-xs text-red-500">{errorSucursales}</p>
                )}
              </>
            ) : (
              <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3">
                <span className="truncate text-sm font-medium">
                  {userHasSucursal
                    ? user?.nombreSucursal || `Sucursal #${user?.idSucursal}`
                    : categoria?.nombreSucursal || "Sin sucursal asignada"}
                </span>
              </div>
            )}
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
