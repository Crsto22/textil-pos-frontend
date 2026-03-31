import { useEffect, useMemo, useState } from "react"
import { ArrowPathIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
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
import { getComprobanteTipoOptions } from "@/lib/comprobante"
import type {
  ComprobanteConfig,
  ComprobanteUpdateRequest,
} from "@/lib/types/comprobante"

interface ComprobanteEditDialogProps {
  open: boolean
  comprobante: ComprobanteConfig | null
  onOpenChange: (open: boolean) => void
  onLoadDetail: (id: number) => Promise<ComprobanteConfig | null>
  onUpdate: (id: number, payload: ComprobanteUpdateRequest) => Promise<boolean>
}

interface EditFormState {
  serie: string
  ultimoCorrelativo: string
  activo: "ACTIVO" | "INACTIVO"
}

function buildFormState(comprobante: ComprobanteConfig | null): EditFormState {
  return {
    serie: comprobante?.serie ?? "",
    ultimoCorrelativo: String(comprobante?.ultimoCorrelativo ?? 0),
    activo: comprobante?.activo === "INACTIVO" ? "INACTIVO" : "ACTIVO",
  }
}

function parseCorrelativo(value: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
}

export function ComprobanteEditDialog({
  open,
  comprobante,
  onOpenChange,
  onLoadDetail,
  onUpdate,
}: ComprobanteEditDialogProps) {
  const [detail, setDetail] = useState<ComprobanteConfig | null>(comprobante)
  const [form, setForm] = useState<EditFormState>(buildFormState(comprobante))
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!open || !comprobante) return

    let mounted = true

    setDetail(comprobante)
    setForm(buildFormState(comprobante))
    setDetailError(null)
    setIsLoadingDetail(true)

    void onLoadDetail(comprobante.idComprobante)
      .then((response) => {
        if (!mounted) return

        if (response) {
          setDetail(response)
          setForm(buildFormState(response))
          return
        }

        setDetailError("No se pudo cargar el detalle actualizado del comprobante.")
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingDetail(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [comprobante, onLoadDetail, open])

  const parsedCorrelativo = parseCorrelativo(form.ultimoCorrelativo)
  const isEditValid = form.serie.trim() !== "" && parsedCorrelativo !== null && detail !== null

  const detailItems = useMemo(
    () => ({
      nombreSucursal: detail?.nombreSucursal || "Sin sucursal",
    }),
    [detail]
  )
  const tipoComprobanteOptions = useMemo(
    () => getComprobanteTipoOptions(detail?.tipoComprobante),
    [detail?.tipoComprobante]
  )

  const resetDialogState = () => {
    setDetail(null)
    setForm(buildFormState(null))
    setDetailError(null)
    setIsLoadingDetail(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isUpdating) return
    onOpenChange(nextOpen)

    if (!nextOpen) {
      resetDialogState()
    }
  }

  const handleUpdate = async () => {
    if (!detail || !isEditValid || parsedCorrelativo === null) return

    setIsUpdating(true)
    try {
      const success = await onUpdate(detail.idComprobante, {
        serie: form.serie.trim(),
        ultimoCorrelativo: parsedCorrelativo,
        activo: form.activo,
      })

      if (success) {
        resetDialogState()
        onOpenChange(false)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton={!isUpdating}>
        <DialogHeader>
          <DialogTitle>Editar Configuracion</DialogTitle>
          <DialogDescription>
            Actualiza la serie, el correlativo y el estado del comprobante.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {isLoadingDetail ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Cargando detalle del comprobante...
            </div>
          ) : null}

          {detailError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              {detailError}
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="comprobante-edit-tipo">Tipo de comprobante</Label>
              <Select value={detail?.tipoComprobante ?? ""} disabled>
                <SelectTrigger id="comprobante-edit-tipo" className="w-full">
                  <SelectValue placeholder="Tipo de comprobante" />
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

            <div className="grid gap-2">
              <Label>Sucursal</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3">
                <span className="truncate text-sm font-medium">
                  {detailItems.nombreSucursal}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="comprobante-edit-serie">Serie</Label>
              <Input
                id="comprobante-edit-serie"
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
              <Label htmlFor="comprobante-edit-correlativo">Ultimo correlativo</Label>
              <Input
                id="comprobante-edit-correlativo"
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
            <Label htmlFor="comprobante-edit-activo">Estado</Label>
            <Select
              value={form.activo}
              onValueChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  activo: value as "ACTIVO" | "INACTIVO",
                }))
              }
            >
              <SelectTrigger id="comprobante-edit-activo" className="w-full">
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
