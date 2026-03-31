import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useSucursalGlobal } from "@/lib/sucursal-global-context"
import { getComprobanteTipoOptions } from "@/lib/comprobante"
import type { ComprobanteCreateRequest } from "@/lib/types/comprobante"

interface ComprobanteCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: ComprobanteCreateRequest) => Promise<boolean>
  initialIdSucursal?: number | null
}

interface CreateFormState {
  idSucursal: number | null
  tipoComprobante: string
  serie: string
  ultimoCorrelativo: string
  activo: "ACTIVO" | "INACTIVO"
}

function hasValidSucursalId(idSucursal?: number | null): idSucursal is number {
  return typeof idSucursal === "number" && idSucursal > 0
}

function parseCorrelativo(value: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
}

export function ComprobanteCreateDialog({
  open,
  onOpenChange,
  onCreate,
  initialIdSucursal = null,
}: ComprobanteCreateDialogProps) {
  const { sucursalGlobal } = useSucursalGlobal()
  const sucursalGlobalRef = useRef(sucursalGlobal)
  useLayoutEffect(() => {
    sucursalGlobalRef.current = sucursalGlobal
  })

  const buildInitialForm = useCallback(
    (): CreateFormState => ({
      idSucursal: hasValidSucursalId(initialIdSucursal)
        ? initialIdSucursal
        : (sucursalGlobalRef.current?.idSucursal ?? null),
      tipoComprobante: "",
      serie: "",
      ultimoCorrelativo: "0",
      activo: "ACTIVO",
    }),
    [initialIdSucursal]
  )

  const [form, setForm] = useState<CreateFormState>(buildInitialForm)
  const [isSaving, setIsSaving] = useState(false)

  const {
    sucursalOptions,
    loadingSucursales,
    errorSucursales,
    searchSucursal,
    setSearchSucursal,
  } = useSucursalOptions(open)

  const hasValidSucursal = hasValidSucursalId(form.idSucursal)
  const parsedCorrelativo = parseCorrelativo(form.ultimoCorrelativo)
  const tipoComprobanteOptions = useMemo(
    () => getComprobanteTipoOptions(form.tipoComprobante),
    [form.tipoComprobante]
  )

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
    hasValidSucursal &&
    form.tipoComprobante.trim() !== "" &&
    form.serie.trim() !== "" &&
    parsedCorrelativo !== null

  useEffect(() => {
    if (!open) return

    setForm(buildInitialForm())
    setSearchSucursal("")
  }, [buildInitialForm, open, setSearchSucursal])

  const resetDialogState = useCallback(() => {
    setForm(buildInitialForm())
    setSearchSucursal("")
  }, [buildInitialForm, setSearchSucursal])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)

    if (!nextOpen) {
      resetDialogState()
    }
  }

  const handleCreate = async () => {
    if (!isCreateValid || parsedCorrelativo === null || !hasValidSucursal) return
    const idSucursal = Number(form.idSucursal)

    setIsSaving(true)
    try {
      const success = await onCreate({
        idSucursal,
        tipoComprobante: form.tipoComprobante.trim(),
        serie: form.serie.trim(),
        ultimoCorrelativo: parsedCorrelativo,
        activo: form.activo,
      })

      if (success) {
        resetDialogState()
        onOpenChange(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Nueva Configuracion</DialogTitle>
          <DialogDescription>
            Registra la configuracion de un comprobante por sucursal, incluida COTIZACION.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="comprobante-create-sucursal">Sucursal</Label>
            <Combobox
              id="comprobante-create-sucursal"
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
            {errorSucursales && <p className="text-xs text-red-500">{errorSucursales}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comprobante-create-tipo">Tipo de comprobante</Label>
            <Select
              value={form.tipoComprobante}
              onValueChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  tipoComprobante: value,
                }))
              }
            >
              <SelectTrigger id="comprobante-create-tipo" className="w-full">
                <SelectValue placeholder="Selecciona tipo de comprobante" />
              </SelectTrigger>
              <SelectContent>
                {tipoComprobanteOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="comprobante-create-serie">Serie</Label>
              <Input
                id="comprobante-create-serie"
                value={form.serie}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    serie: event.target.value,
                  }))
                }
                placeholder="Ej. F001"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comprobante-create-correlativo">Ultimo correlativo</Label>
              <Input
                id="comprobante-create-correlativo"
                type="number"
                min="0"
                step="1"
                value={form.ultimoCorrelativo}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    ultimoCorrelativo: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comprobante-create-activo">Estado</Label>
            <Select
              value={form.activo}
              onValueChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  activo: value as "ACTIVO" | "INACTIVO",
                }))
              }
            >
              <SelectTrigger id="comprobante-create-activo" className="w-full">
                <SelectValue placeholder="Selecciona estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVO">Activo</SelectItem>
                <SelectItem value="INACTIVO">Inactivo</SelectItem>
              </SelectContent>
            </Select>
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
