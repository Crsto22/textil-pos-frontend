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
import { useCategoriaOptions } from "@/lib/hooks/useCategoriaOptions"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { ProductoCreateRequest } from "@/lib/types/producto"

interface ProductoCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: ProductoCreateRequest) => Promise<boolean>
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

function hasValidCategoriaId(idCategoria?: number | null): idCategoria is number {
  return typeof idCategoria === "number" && idCategoria > 0
}

export function ProductoCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: ProductoCreateDialogProps) {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)

  const [form, setForm] = useState<ProductoCreateRequest>(() => ({
    sku: "",
    nombre: "",
    descripcion: "",
    codigoExterno: "",
    idCategoria: null,
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

  const {
    categorias,
    loadingCategorias,
    errorCategorias,
    searchCategoria,
    setSearchCategoria,
  } = useCategoriaOptions(open)

  const hasValidSucursal = hasValidSucursalId(form.idSucursal)
  const hasValidCategoria = hasValidCategoriaId(form.idCategoria)

  const filteredCategorias = useMemo(() => {
    if (!isAdmin || !hasValidSucursal) return categorias
    return categorias.filter((categoria) => categoria.idSucursal === form.idSucursal)
  }, [categorias, form.idSucursal, hasValidSucursal, isAdmin])

  const categoriaOptions = useMemo<ComboboxOption[]>(
    () =>
      filteredCategorias.map((categoria) => ({
        value: String(categoria.idCategoria),
        label: categoria.nombreCategoria,
        description: categoria.nombreSucursal,
      })),
    [filteredCategorias]
  )

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
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
    form.sku.trim() !== "" &&
    form.nombre.trim() !== "" &&
    hasValidCategoria &&
    (!isAdmin || hasValidSucursal)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm({
        sku: "",
        nombre: "",
        descripcion: "",
        codigoExterno: "",
        idCategoria: null,
        idSucursal: isAdmin ? null : user?.idSucursal ?? null,
      })
      setSearchSucursal("")
      setSearchCategoria("")
    }
  }

  const handleCreate = async () => {
    if (!isCreateValid) return

    const payload: ProductoCreateRequest = {
      sku: form.sku.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      codigoExterno: form.codigoExterno.trim(),
      idCategoria: hasValidCategoria ? form.idCategoria : null,
      ...(isAdmin ? { idSucursal: hasValidSucursal ? form.idSucursal : null } : {}),
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
      <DialogContent className="sm:max-w-[560px]" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
          <DialogDescription>
            Completa los datos para crear un nuevo producto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="producto-create-sku">SKU</Label>
            <Input
              id="producto-create-sku"
              placeholder="Ej. POLO-NEGRO-M"
              value={form.sku}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, sku: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="producto-create-nombre">Nombre</Label>
            <Input
              id="producto-create-nombre"
              placeholder="Ej. Polo Negro M"
              value={form.nombre}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, nombre: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="producto-create-codigo-externo">Codigo externo</Label>
            <Input
              id="producto-create-codigo-externo"
              placeholder="Ej. EXT-100"
              value={form.codigoExterno}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  codigoExterno: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="producto-create-descripcion">Descripcion</Label>
            <Textarea
              id="producto-create-descripcion"
              placeholder="Ej. Algodon peinado"
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
            <Label htmlFor="producto-create-sucursal">Sucursal</Label>
            {isAdmin ? (
              <>
                <Combobox
                  id="producto-create-sucursal"
                  value={hasValidSucursal ? String(form.idSucursal) : ""}
                  options={sucursalComboboxOptions}
                  searchValue={searchSucursal}
                  onSearchValueChange={setSearchSucursal}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      idSucursal: Number(value),
                      idCategoria: null,
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

          <div className="grid gap-2">
            <Label htmlFor="producto-create-categoria">Categoria</Label>
            <Combobox
              id="producto-create-categoria"
              value={hasValidCategoria ? String(form.idCategoria) : ""}
              options={categoriaOptions}
              searchValue={searchCategoria}
              onSearchValueChange={setSearchCategoria}
              onValueChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  idCategoria: Number(value),
                }))
              }
              placeholder="Selecciona categoria"
              searchPlaceholder="Buscar categoria..."
              emptyMessage="No se encontraron categorias"
              loading={loadingCategorias}
            />
            {errorCategorias && <p className="text-xs text-red-500">{errorCategorias}</p>}
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
