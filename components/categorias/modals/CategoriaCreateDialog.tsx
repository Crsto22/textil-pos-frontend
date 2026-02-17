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
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/auth-context"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { CategoriaCreateRequest } from "@/lib/types/categoria"

interface CategoriaCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: CategoriaCreateRequest) => Promise<boolean>
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

export function CategoriaCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: CategoriaCreateDialogProps) {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)

  const [form, setForm] = useState<CategoriaCreateRequest>(() => ({
    nombreCategoria: "",
    descripcion: "",
    idSucursal: isAdmin ? null : user?.idSucursal ?? null,
  }))
  const [isSaving, setIsSaving] = useState(false)

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
              label: `Sucursal #${form.idSucursal}`,
            },
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [form.idSucursal, hasValidSucursal, sucursalOptions]
  )

  const isCreateValid =
    form.nombreCategoria.trim() !== "" && (!isAdmin || hasValidSucursal)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm({
        nombreCategoria: "",
        descripcion: "",
        idSucursal: isAdmin ? null : user?.idSucursal ?? null,
      })
      setSearchSucursal("")
    }
  }

  const handleCreate = async () => {
    if (!isCreateValid) return

    const payload: CategoriaCreateRequest = isAdmin
      ? {
          nombreCategoria: form.nombreCategoria.trim(),
          descripcion: form.descripcion.trim(),
          idSucursal: hasValidSucursal ? form.idSucursal : null,
        }
      : {
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

          <div className="grid gap-2">
            <Label htmlFor="categoria-create-sucursal">Sucursal</Label>
            {isAdmin ? (
              <>
                <Combobox
                  id="categoria-create-sucursal"
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
                    : "Sin sucursal asignada"}
                </span>
              </div>
            )}
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
