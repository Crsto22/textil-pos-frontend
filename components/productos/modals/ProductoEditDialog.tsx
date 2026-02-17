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
import { useCategoriaOptions } from "@/lib/hooks/useCategoriaOptions"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import type { Producto, ProductoUpdateRequest } from "@/lib/types/producto"

interface ProductoEditDialogProps {
  open: boolean
  producto: Producto | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: number, payload: ProductoUpdateRequest) => Promise<boolean>
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

function hasValidCategoriaId(idCategoria?: number | null): idCategoria is number {
  return typeof idCategoria === "number" && idCategoria > 0
}

export function ProductoEditDialog({
  open,
  producto,
  onOpenChange,
  onUpdate,
}: ProductoEditDialogProps) {
  const { user } = useAuth()
  const isAdmin = user?.rol === "ADMINISTRADOR"
  const userHasSucursal = hasValidSucursalId(user?.idSucursal)

  const [form, setForm] = useState<ProductoUpdateRequest>({
    sku: "",
    nombre: "",
    descripcion: "",
    codigoExterno: "",
    idCategoria: null,
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

  const categoriaOptions = useMemo<ComboboxOption[]>(() => {
    const mapped = filteredCategorias.map((categoria) => ({
      value: String(categoria.idCategoria),
      label: categoria.nombreCategoria,
      description: categoria.nombreSucursal,
    }))

    if (
      hasValidCategoria &&
      !mapped.some((option) => option.value === String(form.idCategoria))
    ) {
      return [
        {
          value: String(form.idCategoria),
          label: producto?.nombreCategoria || `Categoria #${form.idCategoria}`,
          description: producto?.nombreSucursal,
        },
        ...mapped,
      ]
    }

    return mapped
  }, [
    filteredCategorias,
    form.idCategoria,
    hasValidCategoria,
    producto?.nombreCategoria,
    producto?.nombreSucursal,
  ])

  const sucursalComboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      hasValidSucursal &&
      !sucursalOptions.some((option) => option.value === String(form.idSucursal))
        ? [
            {
              value: String(form.idSucursal),
              label: producto?.nombreSucursal || `Sucursal #${form.idSucursal}`,
            },
            ...sucursalOptions,
          ]
        : sucursalOptions,
    [
      form.idSucursal,
      hasValidSucursal,
      producto?.nombreSucursal,
      sucursalOptions,
    ]
  )

  useEffect(() => {
    if (!open || !producto) return
    setForm({
      sku: producto.sku ?? "",
      nombre: producto.nombre ?? "",
      descripcion: producto.descripcion ?? "",
      codigoExterno: producto.codigoExterno ?? "",
      idCategoria: producto.idCategoria,
      idSucursal: isAdmin ? producto.idSucursal : user?.idSucursal ?? null,
    })
    setSearchSucursal("")
    setSearchCategoria("")
  }, [
    isAdmin,
    open,
    producto,
    setSearchCategoria,
    setSearchSucursal,
    user?.idSucursal,
  ])

  const isEditValid =
    form.sku.trim() !== "" &&
    form.nombre.trim() !== "" &&
    hasValidCategoria &&
    (!isAdmin || hasValidSucursal)

  const handleOpenChange = (nextOpen: boolean) => {
    if (isUpdating) return
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setForm({
        sku: "",
        nombre: "",
        descripcion: "",
        codigoExterno: "",
        idCategoria: null,
        idSucursal: null,
      })
      setSearchSucursal("")
      setSearchCategoria("")
    }
  }

  const handleUpdate = async () => {
    if (!producto || !isEditValid) return

    const payload: ProductoUpdateRequest = {
      sku: form.sku.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      codigoExterno: form.codigoExterno.trim(),
      idCategoria: hasValidCategoria ? form.idCategoria : null,
      ...(isAdmin && hasValidSucursal ? { idSucursal: form.idSucursal } : {}),
    }

    setIsUpdating(true)
    try {
      const success = await onUpdate(producto.idProducto, payload)
      if (success) {
        handleOpenChange(false)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]" showCloseButton={!isUpdating}>
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Modifica los datos del producto seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="producto-edit-sku">SKU</Label>
            <Input
              id="producto-edit-sku"
              value={form.sku}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, sku: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="producto-edit-nombre">Nombre</Label>
            <Input
              id="producto-edit-nombre"
              value={form.nombre}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, nombre: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="producto-edit-codigo-externo">Codigo externo</Label>
            <Input
              id="producto-edit-codigo-externo"
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
            <Label htmlFor="producto-edit-descripcion">Descripcion</Label>
            <Textarea
              id="producto-edit-descripcion"
              value={form.descripcion}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  descripcion: event.target.value,
                }))
              }
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="producto-edit-sucursal">Sucursal</Label>
            {isAdmin ? (
              <>
                <Combobox
                  id="producto-edit-sucursal"
                  value={hasValidSucursal ? String(form.idSucursal) : ""}
                  options={sucursalComboboxOptions}
                  searchValue={searchSucursal}
                  onSearchValueChange={setSearchSucursal}
                  onValueChange={(value) =>
                    setForm((previous) => {
                      const nextSucursal = Number(value)
                      return {
                        ...previous,
                        idSucursal: nextSucursal,
                        idCategoria:
                          previous.idSucursal === nextSucursal
                            ? previous.idCategoria
                            : null,
                      }
                    })
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
                    : producto?.nombreSucursal || "Sin sucursal asignada"}
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="producto-edit-categoria">Categoria</Label>
            <Combobox
              id="producto-edit-categoria"
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
