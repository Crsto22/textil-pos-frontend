"use client"

import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth/auth-fetch"
import { useDocumentoLookup } from "@/lib/hooks/useDocumentoLookup"
import type { DocumentoDniResponse, DocumentoRucResponse } from "@/lib/types/documento"
import type {
  CatalogoConductor,
  CatalogoConductorPayload,
  CatalogoTransportista,
  CatalogoTransportistaPayload,
  CatalogoVehiculo,
  CatalogoVehiculoPayload,
} from "@/lib/types/guia-remision-catalogos"
import {
  normalizeCatalogoConductor,
  normalizeCatalogoTransportista,
  normalizeCatalogoVehiculo,
} from "@/lib/types/guia-remision-catalogos"

export type ConductorCatalogForm = {
  tipoDocumento: string
  nroDocumento: string
  nombres: string
  apellidos: string
  licencia: string
}

export type VehiculoCatalogForm = {
  placa: string
}

export type TransportistaCatalogForm = {
  transportistaNroDoc: string
  transportistaRazonSocial: string
  transportistaRegistroMtc: string
}

interface ConductorCatalogFormFieldsProps {
  form: ConductorCatalogForm
  setForm: Dispatch<SetStateAction<ConductorCatalogForm>>
  disabled: boolean
}

interface VehiculoCatalogFormFieldsProps {
  form: VehiculoCatalogForm
  setForm: Dispatch<SetStateAction<VehiculoCatalogForm>>
  disabled: boolean
}

interface TransportistaCatalogFormFieldsProps {
  form: TransportistaCatalogForm
  setForm: Dispatch<SetStateAction<TransportistaCatalogForm>>
  disabled: boolean
}

interface CatalogoCreateDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

async function parseJsonSafe<T>(response: Response) {
  return response.json().catch(() => null) as Promise<T | null>
}

function normalizeApiText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
}

export function createEmptyConductorCatalogForm(): ConductorCatalogForm {
  return {
    tipoDocumento: "1",
    nroDocumento: "",
    nombres: "",
    apellidos: "",
    licencia: "",
  }
}

export function createEmptyVehiculoCatalogForm(): VehiculoCatalogForm {
  return {
    placa: "",
  }
}

export function createEmptyTransportistaCatalogForm(): TransportistaCatalogForm {
  return {
    transportistaNroDoc: "",
    transportistaRazonSocial: "",
    transportistaRegistroMtc: "",
  }
}

export function isConductorCatalogFormValid(form: ConductorCatalogForm) {
  return (
    form.nroDocumento.trim().length > 0 &&
    form.nombres.trim().length > 0 &&
    form.licencia.trim().length > 0
  )
}

export function isVehiculoCatalogFormValid(form: VehiculoCatalogForm) {
  return form.placa.trim().length > 0
}

export function isTransportistaCatalogFormValid(form: TransportistaCatalogForm) {
  return (
    form.transportistaNroDoc.trim().length === 11 &&
    form.transportistaRazonSocial.trim().length > 0
  )
}

export function buildConductorCatalogPayload(
  form: ConductorCatalogForm
): CatalogoConductorPayload {
  return {
    tipoDocumento: form.tipoDocumento,
    nroDocumento: form.nroDocumento.trim(),
    nombres: form.nombres.trim(),
    apellidos: form.apellidos.trim(),
    licencia: form.licencia.trim(),
  }
}

export function buildVehiculoCatalogPayload(
  form: VehiculoCatalogForm
): CatalogoVehiculoPayload {
  return {
    placa: form.placa.trim().toUpperCase(),
  }
}

export function buildTransportistaCatalogPayload(
  form: TransportistaCatalogForm
): CatalogoTransportistaPayload {
  return {
    transportistaTipoDoc: "6",
    transportistaNroDoc: form.transportistaNroDoc.trim(),
    transportistaRazonSocial: form.transportistaRazonSocial.trim(),
    transportistaRegistroMtc: form.transportistaRegistroMtc.trim() || null,
  }
}

export function ConductorCatalogFormFields({
  form,
  setForm,
  disabled,
}: ConductorCatalogFormFieldsProps) {
  const { loading: isLooking, error: lookupError, clearError, lookupDocumento } =
    useDocumentoLookup()

  const setField = (field: keyof ConductorCatalogForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const canLookup = form.nroDocumento.trim().length === 8 && !disabled

  const handleLookup = async () => {
    if (!canLookup) return

    const result = await lookupDocumento("DNI", form.nroDocumento)
    if (!result.ok) return

    const data = result.data as DocumentoDniResponse
    const nombres = normalizeApiText(data.nombres)
    const apellidos = [normalizeApiText(data.apellidoPaterno), normalizeApiText(data.apellidoMaterno)]
      .filter(Boolean)
      .join(" ")

    setForm((prev) => ({
      ...prev,
      ...(nombres ? { nombres } : {}),
      ...(apellidos ? { apellidos } : {}),
    }))
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Tipo de documento</Label>
          <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
            DNI
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cond-nro-doc">Numero de documento</Label>
          <div className="flex items-start gap-2">
            <Input
              id="cond-nro-doc"
              value={form.nroDocumento}
              onChange={(event) => {
                clearError()
                setField("nroDocumento", event.target.value.replace(/\D/g, "").slice(0, 8))
              }}
              disabled={disabled}
              placeholder="72889911"
              maxLength={8}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                void handleLookup()
              }}
              disabled={!canLookup || isLooking}
            >
              {isLooking ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>
          {lookupError ? <p className="text-xs text-red-500">{lookupError}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="cond-nombres">Nombres</Label>
          <Input
            id="cond-nombres"
            value={form.nombres}
            onChange={(event) => setField("nombres", event.target.value)}
            disabled={disabled}
            placeholder="Juan Carlos"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cond-apellidos">Apellidos</Label>
          <Input
            id="cond-apellidos"
            value={form.apellidos}
            onChange={(event) => setField("apellidos", event.target.value)}
            disabled={disabled}
            placeholder="Perez Soto"
          />
        </div>
      </div>

        <div className="grid gap-2">
          <Label htmlFor="cond-licencia">Licencia</Label>
          <Input
            id="cond-licencia"
            value={form.licencia}
            onChange={(event) => setField("licencia", event.target.value)}
            disabled={disabled}
            placeholder="Q12345678"
          />
        </div>
    </>
  )
}

export function VehiculoCatalogFormFields({
  form,
  setForm,
  disabled,
}: VehiculoCatalogFormFieldsProps) {
  const setField = (field: keyof VehiculoCatalogForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="veh-placa">Placa</Label>
        <Input
          id="veh-placa"
          value={form.placa}
          onChange={(event) => setField("placa", event.target.value.toUpperCase())}
          disabled={disabled}
          placeholder="ABC-123"
          maxLength={10}
          className="uppercase"
        />
      </div>
    </div>
  )
}

export function TransportistaCatalogFormFields({
  form,
  setForm,
  disabled,
}: TransportistaCatalogFormFieldsProps) {
  const { loading: isLooking, error: lookupError, clearError, lookupDocumento } =
    useDocumentoLookup()

  const setField = (field: keyof TransportistaCatalogForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const canLookup = form.transportistaNroDoc.trim().length === 11 && !disabled

  const handleLookup = async () => {
    if (!canLookup) return

    const result = await lookupDocumento("RUC", form.transportistaNroDoc)
    if (!result.ok) return

    const data = result.data as DocumentoRucResponse
    const razonSocial =
      typeof data.razonSocial === "string" ? data.razonSocial.replace(/\s+/g, " ").trim() : ""

    if (razonSocial) {
      setForm((prev) => ({ ...prev, transportistaRazonSocial: razonSocial }))
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Tipo de documento</Label>
          <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
            RUC
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="transp-nro-doc">Numero de documento</Label>
          <div className="flex items-start gap-2">
            <Input
              id="transp-nro-doc"
              value={form.transportistaNroDoc}
              onChange={(event) => {
                clearError()
                setField(
                  "transportistaNroDoc",
                  event.target.value.replace(/\D/g, "").slice(0, 11)
                )
              }}
              disabled={disabled}
              placeholder="20552103816"
              maxLength={11}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                void handleLookup()
              }}
              disabled={!canLookup || isLooking}
            >
              {isLooking ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>
          {lookupError ? <p className="text-xs text-red-500">{lookupError}</p> : null}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="transp-razon-social">Razon social</Label>
        <Input
          id="transp-razon-social"
          value={form.transportistaRazonSocial}
          onChange={(event) => setField("transportistaRazonSocial", event.target.value)}
          disabled={disabled}
          placeholder="Transportes Kimets SAC"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="transp-registro-mtc">
          Registro MTC{" "}
          <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="transp-registro-mtc"
          value={form.transportistaRegistroMtc}
          onChange={(event) => setField("transportistaRegistroMtc", event.target.value)}
          disabled={disabled}
          placeholder="1234567890"
        />
      </div>
    </>
  )
}

export function GuiaConductorCreateDialog({
  open,
  onClose,
  onSuccess,
  onCreated,
}: CatalogoCreateDialogProps & { onCreated?: (item: CatalogoConductor) => void }) {
  const [form, setForm] = useState<ConductorCatalogForm>(createEmptyConductorCatalogForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(createEmptyConductorCatalogForm())
  }, [open])

  const handleCreate = async () => {
    if (!isConductorCatalogFormValid(form)) return

    setSaving(true)
    try {
      const response = await authFetch("/api/guia-remision/catalogos/conductores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildConductorCatalogPayload(form)),
      })
      const data = await parseJsonSafe<unknown>(response)

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data
            ? String((data as Record<string, unknown>).message)
            : "No se pudo crear el conductor"
        toast.error(message)
        return
      }

      toast.success("Conductor creado correctamente")
      const created = normalizeCatalogoConductor(data)
      if (created) onCreated?.(created)
      onSuccess?.()
      onClose()
    } catch {
      toast.error("Error de conexion al crear el conductor")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-[640px]" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Nuevo conductor</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo conductor.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <ConductorCatalogFormFields form={form} setForm={setForm} disabled={saving} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!isConductorCatalogFormValid(form) || saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function GuiaVehiculoCreateDialog({
  open,
  onClose,
  onSuccess,
  onCreated,
}: CatalogoCreateDialogProps & { onCreated?: (item: CatalogoVehiculo) => void }) {
  const [form, setForm] = useState<VehiculoCatalogForm>(createEmptyVehiculoCatalogForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(createEmptyVehiculoCatalogForm())
  }, [open])

  const handleCreate = async () => {
    if (!isVehiculoCatalogFormValid(form)) return

    setSaving(true)
    try {
      const response = await authFetch("/api/guia-remision/catalogos/vehiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildVehiculoCatalogPayload(form)),
      })
      const data = await parseJsonSafe<unknown>(response)

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data
            ? String((data as Record<string, unknown>).message)
            : "No se pudo crear el vehiculo"
        toast.error(message)
        return
      }

      toast.success("Vehiculo creado correctamente")
      const created = normalizeCatalogoVehiculo(data)
      if (created) onCreated?.(created)
      onSuccess?.()
      onClose()
    } catch {
      toast.error("Error de conexion al crear el vehiculo")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-[640px]" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Nueva placa</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar una nueva placa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <VehiculoCatalogFormFields form={form} setForm={setForm} disabled={saving} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!isVehiculoCatalogFormValid(form) || saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function GuiaTransportistaCreateDialog({
  open,
  onClose,
  onSuccess,
  onCreated,
}: CatalogoCreateDialogProps & { onCreated?: (item: CatalogoTransportista) => void }) {
  const [form, setForm] = useState<TransportistaCatalogForm>(createEmptyTransportistaCatalogForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(createEmptyTransportistaCatalogForm())
  }, [open])

  const handleCreate = async () => {
    if (!isTransportistaCatalogFormValid(form)) return

    setSaving(true)
    try {
      const response = await authFetch("/api/guia-remision/catalogos/transportistas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildTransportistaCatalogPayload(form)),
      })
      const data = await parseJsonSafe<unknown>(response)

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data
            ? String((data as Record<string, unknown>).message)
            : "No se pudo crear el transportista"
        toast.error(message)
        return
      }

      toast.success("Transportista creado correctamente")
      const created = normalizeCatalogoTransportista(data)
      if (created) onCreated?.(created)
      onSuccess?.()
      onClose()
    } catch {
      toast.error("Error de conexion al crear el transportista")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-[640px]" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Nuevo transportista</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo transportista.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <TransportistaCatalogFormFields form={form} setForm={setForm} disabled={saving} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!isTransportistaCatalogFormValid(form) || saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
