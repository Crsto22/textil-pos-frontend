import { useCallback, useEffect, useMemo, useState } from "react"

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
import type { ComprobanteCreateRequest } from "@/lib/types/comprobante"

interface ComprobanteCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: ComprobanteCreateRequest) => Promise<boolean>
}

interface CreateFormState {
  tipoComprobante: string
  serie: string
  ultimoCorrelativo: string
  activo: "ACTIVO" | "INACTIVO"
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
}: ComprobanteCreateDialogProps) {
  const isMobile = useIsMobile()

  const buildInitialForm = useCallback(
    (): CreateFormState => ({
      tipoComprobante: "",
      serie: "",
      ultimoCorrelativo: "0",
      activo: "ACTIVO",
    }),
    []
  )

  const [form, setForm] = useState<CreateFormState>(buildInitialForm)
  const [isSaving, setIsSaving] = useState(false)

  const parsedCorrelativo = parseCorrelativo(form.ultimoCorrelativo)
  const tipoComprobanteOptions = useMemo(
    () => getComprobanteTipoOptions(form.tipoComprobante),
    [form.tipoComprobante]
  )

  const isCreateValid =
    form.tipoComprobante.trim() !== "" &&
    form.serie.trim() !== "" &&
    parsedCorrelativo !== null

  useEffect(() => {
    if (!open) return
    setForm(buildInitialForm())
  }, [buildInitialForm, open])

  const resetDialogState = useCallback(() => {
    setForm(buildInitialForm())
  }, [buildInitialForm])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return
    onOpenChange(nextOpen)
    if (!nextOpen) resetDialogState()
  }

  const handleCreate = async () => {
    if (!isCreateValid || parsedCorrelativo === null) return
    setIsSaving(true)
    try {
      const success = await onCreate({
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

  const formBody = (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="comprobante-create-tipo">Tipo de comprobante</Label>
        <Select
          value={form.tipoComprobante}
          onValueChange={(value) => setForm((prev) => ({ ...prev, tipoComprobante: value }))}
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
            onChange={(e) => setForm((prev) => ({ ...prev, serie: e.target.value }))}
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
            onChange={(e) => setForm((prev) => ({ ...prev, ultimoCorrelativo: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="comprobante-create-activo">Estado</Label>
        <Select
          value={form.activo}
          onValueChange={(value) => setForm((prev) => ({ ...prev, activo: value as "ACTIVO" | "INACTIVO" }))}
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
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="flex h-[85dvh] flex-col gap-0 p-0">
          <SheetHeader className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700/60">
            <SheetTitle className="text-sm">Nueva Configuracion</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
            {formBody}
          </div>
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700/60">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1" onClick={handleCreate} disabled={!isCreateValid || isSaving}>
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]" showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>Nueva Configuracion</DialogTitle>
          <DialogDescription>
            Registra una configuracion global de serie para un tipo de comprobante.
          </DialogDescription>
        </DialogHeader>
        {formBody}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleCreate} disabled={!isCreateValid || isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
