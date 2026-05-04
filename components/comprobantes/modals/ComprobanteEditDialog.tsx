import { useEffect, useMemo, useState } from "react"
import { ArrowPathIcon } from "@heroicons/react/24/outline"
import { LoaderSpinner } from "@/components/ui/loader-spinner"

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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getComprobanteTipoOptions } from "@/lib/comprobante"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
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
  const isMobile = useIsMobile()

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
        if (mounted) setIsLoadingDetail(false)
      })

    return () => { mounted = false }
  }, [comprobante, onLoadDetail, open])

  const parsedCorrelativo = parseCorrelativo(form.ultimoCorrelativo)
  const isEditValid = form.serie.trim() !== "" && parsedCorrelativo !== null && detail !== null

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
    if (!nextOpen) resetDialogState()
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

  const formBody = (
    <div className="grid gap-4 py-2">
      {isLoadingDetail ? (
        <div className="flex items-center justify-center rounded-lg border bg-muted/40 px-3 py-4">
          <LoaderSpinner size="sm" text="Cargando detalle del comprobante..." />
        </div>
      ) : null}

      {detailError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
          {detailError}
        </div>
      ) : null}

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

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="comprobante-edit-serie">Serie</Label>
          <Input
            id="comprobante-edit-serie"
            value={form.serie}
            onChange={(e) => setForm((prev) => ({ ...prev, serie: e.target.value }))}
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
            onChange={(e) => setForm((prev) => ({ ...prev, ultimoCorrelativo: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="comprobante-edit-activo">Estado</Label>
        <Select
          value={form.activo}
          onValueChange={(value) => setForm((prev) => ({ ...prev, activo: value as "ACTIVO" | "INACTIVO" }))}
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
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="flex h-[85dvh] flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Editar Configuracion</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
            {formBody}
          </div>
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={isUpdating} onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1" onClick={handleUpdate} disabled={!isEditValid || isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
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
        {formBody}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isUpdating}>Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleUpdate} disabled={!isEditValid || isUpdating}>
            {isUpdating ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
