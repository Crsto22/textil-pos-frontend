"use client"

import { useState } from "react"
import { ArrowRightEndOnRectangleIcon, ArrowRightStartOnRectangleIcon, NoSymbolIcon, PencilSquareIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"
import { asistenciaMutation } from "@/lib/hooks/useAsistenciaData"
import { useAsistenciaOptions } from "@/lib/hooks/useAsistenciaOptions"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { Combobox } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { MarcacionAsistencia } from "@/lib/types/asistencia"

type ManualDefaults = { idTrabajador?: number; idSucursal?: number; fecha?: string; tipoEvento?: "ENTRADA" | "SALIDA" }

export function MarcacionManualDialog({ open, onOpenChange, onSaved, defaults }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  defaults?: ManualDefaults
}) {
  const formKey = open
    ? `${defaults?.idTrabajador ?? ""}-${defaults?.idSucursal ?? ""}-${defaults?.fecha ?? ""}-${defaults?.tipoEvento ?? ""}`
    : "closed"
  return <MarcacionManualDialogForm key={formKey} open={open} onOpenChange={onOpenChange} onSaved={onSaved} defaults={defaults} />
}

function MarcacionManualDialogForm({ open, onOpenChange, onSaved, defaults }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  defaults?: ManualDefaults
}) {
  const workers = useAsistenciaOptions("trabajadores", open)
  const { sucursalOptions, loadingSucursales, searchSucursal, setSearchSucursal } = useSucursalOptions(open)
  const [worker, setWorker] = useState(() => defaults?.idTrabajador ? String(defaults.idTrabajador) : "")
  const [branch, setBranch] = useState(() => defaults?.idSucursal ? String(defaults.idSucursal) : "")
  const [dateTime, setDateTime] = useState(() => {
    const now = limaNow()
    return `${defaults?.fecha ?? now.slice(0, 10)}T${now.slice(11, 16)}`
  })
  const [type, setType] = useState<"ENTRADA" | "SALIDA">(() => defaults?.tipoEvento ?? "ENTRADA")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!worker || !branch || !dateTime || reason.trim().length < 10) {
      toast.error("Completa todos los campos y escribe un motivo de al menos 10 caracteres")
      return
    }
    setSaving(true)
    const result = await asistenciaMutation<MarcacionAsistencia>("/api/asistencia/marcaciones/manuales", "POST", {
      idTrabajador: Number(worker), idSucursal: Number(branch), fechaHora: `${dateTime}:00`, tipoEvento: type, motivo: reason.trim(),
    })
    setSaving(false)
    if (!result.ok) return toast.error(result.message)
    toast.success(`${type === "ENTRADA" ? "Entrada" : "Salida"} registrada correctamente`)
    onOpenChange(false)
    onSaved()
  }

  const TypeIcon = type === "ENTRADA" ? ArrowRightEndOnRectangleIcon : ArrowRightStartOnRectangleIcon
  return <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><PencilSquareIcon className="h-5 w-5 text-blue-600" />Nueva marcacion manual</DialogTitle><DialogDescription>Completa una entrada o salida olvidada. El registro quedara auditado.</DialogDescription></DialogHeader>
      <div className="grid gap-4 py-2">
        <Field label="Trabajador"><Combobox value={worker} options={workers.options} searchValue={workers.search} onSearchValueChange={workers.setSearch} onValueChange={setWorker} placeholder="Seleccionar trabajador" loading={workers.loading} disabled={Boolean(defaults?.idTrabajador)} /></Field>
        <Field label="Sucursal"><Combobox value={branch} options={sucursalOptions} searchValue={searchSucursal} onSearchValueChange={setSearchSucursal} onValueChange={setBranch} placeholder="Seleccionar sucursal" loading={loadingSucursales} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Fecha y hora"><Input type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} /></Field><Field label="Tipo"><Select value={type} onValueChange={(value) => setType(value as "ENTRADA" | "SALIDA")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ENTRADA">Entrada</SelectItem><SelectItem value="SALIDA">Salida</SelectItem></SelectContent></Select></Field></div>
        <Field label="Motivo"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={255} placeholder="Ej. El trabajador olvido registrar su salida" /><span className="text-right text-xs text-muted-foreground">{reason.length}/255</span></Field>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button><Button onClick={() => void save()} disabled={saving}><TypeIcon className="h-4 w-4" />{saving ? "Guardando..." : `Registrar ${type.toLowerCase()}`}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}

export function AnularMarcacionDialog(props: { mark: MarcacionAsistencia | null; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  return <AnularMarcacionDialogForm key={props.mark?.idMarcacion ?? "closed"} {...props} />
}

function AnularMarcacionDialogForm({ mark, onOpenChange, onSaved }: { mark: MarcacionAsistencia | null; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  async function annul() {
    if (!mark || reason.trim().length < 10) return toast.error("Escribe un motivo de al menos 10 caracteres")
    setSaving(true)
    const result = await asistenciaMutation<MarcacionAsistencia>(`/api/asistencia/marcaciones/${mark.idMarcacion}/anular`, "POST", { motivo: reason.trim() })
    setSaving(false)
    if (!result.ok) return toast.error(result.message)
    toast.success("Marcacion anulada; el historial original se conserva")
    onOpenChange(false)
    onSaved()
  }
  return <Dialog open={mark !== null} onOpenChange={(open) => !saving && onOpenChange(open)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2 text-red-700"><NoSymbolIcon className="h-5 w-5" />Anular marcacion</DialogTitle><DialogDescription>Esta accion no elimina el registro y no se puede revertir.</DialogDescription></DialogHeader><Field label="Motivo de anulacion"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={255} placeholder="Explica por que esta marcacion no debe calcularse" /></Field><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button><Button variant="destructive" onClick={() => void annul()} disabled={saving}>{saving ? "Anulando..." : "Anular marcacion"}</Button></DialogFooter></DialogContent></Dialog>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label>{label}</Label>{children}</div> }

function limaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`
}
