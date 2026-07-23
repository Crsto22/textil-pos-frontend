"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"
import { useTurnoOptions } from "@/lib/hooks/useTurnoOptions"
import { useDocumentoLookup } from "@/lib/hooks/useDocumentoLookup"
import { useUsuarioOptions } from "@/lib/hooks/useUsuarioOptions"
import { useAsistenciaOptions } from "@/lib/hooks/useAsistenciaOptions"
import type { DispositivoAsistencia, DispositivoRequest, EstadoRegistro, Trabajador, TrabajadorRequest } from "@/lib/types/asistencia"

interface WorkerDialogProps {
  open: boolean
  worker: Trabajador | null
  onOpenChange: (open: boolean) => void
  onSave: (payload: TrabajadorRequest) => Promise<boolean>
}

const emptyWorker: TrabajadorRequest = { codigoZkteco: "", dni: "", nombres: "", apellidos: "", idSucursal: null, idTurno: null, idCargo: null, rotativo: false, estado: "ACTIVO", idUsuario: null }

function getInitials(fullName?: string | null) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? []
  if (parts.length === 0) return "U"
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`.toUpperCase()
}

export function TrabajadorDialog({ open, worker, onOpenChange, onSave }: WorkerDialogProps) {
  const [form, setForm] = useState<TrabajadorRequest>(emptyWorker)
  const [hasUserAccount, setHasUserAccount] = useState(false)
  const [hasShift, setHasShift] = useState(false)
  const [saving, setSaving] = useState(false)
  const sucursales = useSucursalOptions(open)
  const turnos = useTurnoOptions(open && hasShift)
  const usuarios = useUsuarioOptions(open && hasUserAccount)
  const cargos = useAsistenciaOptions("asistencia/cargos", open)
  const { loading: lookingUpDni, error: dniError, clearError: clearDniError, lookupDocumento } = useDocumentoLookup()

  useEffect(() => {
    if (!open) return
    setForm(worker ? { codigoZkteco: worker.codigoZkteco, dni: worker.dni, nombres: worker.nombres, apellidos: worker.apellidos, idSucursal: worker.idSucursal, idTurno: worker.idTurno, idCargo: worker.idCargo, rotativo: worker.rotativo, estado: worker.estado, idUsuario: worker.idUsuario } : emptyWorker)
    setHasUserAccount(Boolean(worker?.idUsuario))
    setHasShift(Boolean(worker?.idTurno))
    clearDniError()
  }, [clearDniError, open, worker])

  const branchOptions = useMemo<ComboboxOption[]>(() => [
    ...(form.rotativo ? [{ value: "SIN_BASE", label: "Sin sucursal base" }] : []),
    ...(form.idSucursal !== null && form.idSucursal > 0 && !sucursales.sucursalOptions.some((option) => option.value === String(form.idSucursal)) ? [sucursales.getSucursalOptionById(form.idSucursal, worker?.sucursal ?? undefined)] : []),
    ...sucursales.sucursalOptions,
  ], [form.idSucursal, form.rotativo, sucursales, worker?.sucursal])
  const turnoOptions = useMemo<ComboboxOption[]>(() => [
    ...(form.idTurno !== null && form.idTurno > 0 && !turnos.turnoOptions.some((option) => option.value === String(form.idTurno)) ? [turnos.getTurnoOptionById(form.idTurno, worker?.turno ?? undefined)] : []),
    ...turnos.turnoOptions,
  ], [form.idTurno, turnos, worker?.turno])
  const usuarioOptions = useMemo<ComboboxOption[]>(() => [
    ...(form.idUsuario && !usuarios.usuarioOptions.some((option) => option.value === String(form.idUsuario))
      ? [{ value: String(form.idUsuario), label: worker?.usuarioNombre ?? `Usuario #${form.idUsuario}`, description: worker?.usuarioCorreo ?? undefined, avatarText: getInitials(worker?.usuarioNombre) }]
      : []),
    ...usuarios.usuarios.map((usuario) => ({
      value: String(usuario.idUsuario),
      label: `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim() || `Usuario #${usuario.idUsuario}`,
      description: [usuario.dni, usuario.rol, usuario.nombreSucursal].filter(Boolean).join(" - "),
      avatarText: getInitials(`${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`),
      avatarClassName: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    })),
  ], [form.idUsuario, usuarios.usuarioOptions, usuarios.usuarios, worker?.usuarioCorreo, worker?.usuarioNombre])
  const cargoOptions = useMemo<ComboboxOption[]>(() => [
    ...(form.idCargo && !cargos.options.some((option) => option.value === String(form.idCargo))
      ? [{ value: String(form.idCargo), label: worker?.cargo ?? `Cargo #${form.idCargo}`, description: worker?.cargoEstado === "INACTIVO" ? "Inactivo" : undefined }]
      : []),
    ...cargos.options,
  ], [cargos.options, form.idCargo, worker?.cargo, worker?.cargoEstado])
  const valid = /^\d{1,24}$/.test(form.codigoZkteco) && /^\d{8}$/.test(form.dni) && !!form.nombres.trim() && !!form.apellidos.trim() && form.idCargo !== null && form.idCargo > 0 && (form.rotativo || (form.idSucursal !== null && form.idSucursal > 0)) && (!hasShift || (form.idTurno !== null && form.idTurno > 0)) && (!hasUserAccount || form.idUsuario !== null)

  async function searchDni() {
    if (!/^\d{8}$/.test(form.dni)) return
    const result = await lookupDocumento("DNI", form.dni)
    if (result.ok && result.tipoDocumento === "DNI") {
      setForm((previous) => ({
        ...previous,
        nombres: result.data.nombres ?? "",
        apellidos: [result.data.apellidoPaterno, result.data.apellidoMaterno].filter(Boolean).join(" "),
      }))
    }
  }

  function selectUsuario(value: string) {
    const usuario = usuarios.usuarios.find((item) => item.idUsuario === Number(value))
    if (!usuario) return
    clearDniError()
    if (usuario.idTurno) setHasShift(true)
    setForm((previous) => ({
      ...previous,
      idUsuario: usuario.idUsuario,
      dni: usuario.dni,
      nombres: usuario.nombre,
      apellidos: usuario.apellido,
      idSucursal: usuario.idSucursal ?? previous.idSucursal,
      idTurno: usuario.idTurno ?? previous.idTurno,
    }))
  }

  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      if (await onSave({ ...form, nombres: form.nombres.trim(), apellidos: form.apellidos.trim() })) onOpenChange(false)
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader><DialogTitle>{worker ? "Editar trabajador" : "Nuevo trabajador"}</DialogTitle><DialogDescription>El codigo debe coincidir exactamente con el User ID configurado en el reloj.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-3 sm:col-span-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">Tiene cuenta de usuario</p>
              <p className="text-xs text-muted-foreground">Vincula una cuenta existente del sistema.</p>
            </div>
            <Switch checked={hasUserAccount} onCheckedChange={(checked) => { setHasUserAccount(checked); if (!checked) setForm((previous) => ({ ...previous, idUsuario: null })) }} />
          </div>
          {hasUserAccount ? <div className="grid gap-2 sm:col-span-2">
            <Label>Cuenta de usuario</Label>
            <Combobox value={form.idUsuario ? String(form.idUsuario) : ""} options={usuarioOptions} searchValue={usuarios.searchUsuario} onSearchValueChange={usuarios.setSearchUsuario} onValueChange={selectUsuario} placeholder="Seleccionar cuenta" searchPlaceholder="Buscar por nombre o DNI..." loading={usuarios.loadingUsuarios} emptyMessage="No se encontraron usuarios" />
            {usuarios.errorUsuarios ? <p className="text-xs text-red-500">{usuarios.errorUsuarios}</p> : !form.idUsuario ? <p className="text-xs text-amber-600 dark:text-amber-400">Selecciona una cuenta para continuar.</p> : <p className="text-xs text-muted-foreground">Los datos del usuario seleccionado se completaran automaticamente.</p>}
          </div> : null}
          <Field label="Codigo ZKTeco"><Input value={form.codigoZkteco} maxLength={24} onChange={(e) => setForm({ ...form, codigoZkteco: e.target.value.replace(/\D/g, "") })} /></Field>
          <div className="grid gap-2">
            <Label htmlFor="trabajador-dni">DNI</Label>
            <div className="flex gap-2">
              <Input id="trabajador-dni" value={form.dni} maxLength={8} onChange={(e) => { clearDniError(); setForm({ ...form, dni: e.target.value.replace(/\D/g, "").slice(0, 8), idUsuario: null }) }} />
              <Button type="button" variant="outline" onClick={() => void searchDni()} disabled={!/^\d{8}$/.test(form.dni) || lookingUpDni}>
                {lookingUpDni ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <MagnifyingGlassIcon className="h-4 w-4" />}
                Buscar
              </Button>
            </div>
            {dniError ? <p className="text-xs text-red-500">{dniError}</p> : form.dni.length > 0 && form.dni.length < 8 ? <p className="text-xs text-red-500">Debe tener 8 digitos ({form.dni.length}/8)</p> : null}
          </div>
          <Field label="Nombres"><Input value={form.nombres} maxLength={100} onChange={(e) => setForm({ ...form, nombres: e.target.value })} /></Field>
          <Field label="Apellidos"><Input value={form.apellidos} maxLength={100} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} /></Field>
          <div className="grid gap-2 sm:col-span-2"><Label>Cargo</Label><Combobox value={form.idCargo ? String(form.idCargo) : ""} options={cargoOptions} searchValue={cargos.search} onSearchValueChange={cargos.setSearch} onValueChange={(value) => setForm({ ...form, idCargo: Number(value) })} placeholder="Seleccionar cargo" searchPlaceholder="Buscar cargo..." loading={cargos.loading} emptyMessage="No se encontraron cargos activos" />{!form.idCargo ? <p className="text-xs text-amber-600 dark:text-amber-400">Selecciona un cargo para continuar.</p> : worker?.cargoEstado === "INACTIVO" && form.idCargo === worker.idCargo ? <p className="text-xs text-amber-600 dark:text-amber-400">Este cargo esta inactivo; se conservara mientras no selecciones otro.</p> : null}</div>
          <Field label={form.rotativo ? "Sucursal base (opcional)" : "Sucursal base"}><Combobox value={form.idSucursal ? String(form.idSucursal) : form.rotativo ? "SIN_BASE" : ""} options={branchOptions} searchValue={sucursales.searchSucursal} onSearchValueChange={sucursales.setSearchSucursal} onValueChange={(value) => setForm({ ...form, idSucursal: value === "SIN_BASE" ? null : Number(value) })} placeholder={form.rotativo ? "Sin sucursal base" : "Seleccionar sucursal"} loading={sucursales.loadingSucursales} /></Field>
          <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-3 sm:col-span-2">
            <div className="min-w-0"><p className="text-sm font-medium">Tiene turno</p><p className="text-xs text-muted-foreground">Activalo para controlar horario, tardanza y faltas.</p></div>
            <Switch checked={hasShift} onCheckedChange={(checked) => { setHasShift(checked); if (!checked) setForm((previous) => ({ ...previous, idTurno: null })) }} />
          </div>
          {hasShift ? <div className="grid gap-2 sm:col-span-2"><Label>Turno</Label><Combobox value={form.idTurno ? String(form.idTurno) : ""} options={turnoOptions} searchValue={turnos.searchTurno} onSearchValueChange={turnos.setSearchTurno} onValueChange={(value) => setForm({ ...form, idTurno: Number(value) })} placeholder="Seleccionar turno" loading={turnos.loadingTurnos} /></div> : null}
          <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-3 sm:col-span-2">
            <div className="min-w-0"><p className="text-sm font-medium">Trabajador rotativo</p><p className="text-xs text-muted-foreground">Calcula entradas y salidas por cada sucursal visitada.</p></div>
            <Switch checked={form.rotativo} onCheckedChange={(checked) => setForm({ ...form, rotativo: checked })} />
          </div>
          {worker ? <div className="flex items-center justify-between rounded-lg border px-3 py-2 sm:col-span-2"><span className="text-sm font-medium">Trabajador activo</span><Switch checked={form.estado === "ACTIVO"} onCheckedChange={(checked) => setForm({ ...form, estado: checked ? "ACTIVO" : "INACTIVO" })} /></div> : null}
        </div>
        <DialogFooter><DialogClose asChild><Button variant="outline" disabled={saving}>Cancelar</Button></DialogClose><Button disabled={!valid || saving} onClick={save}>{saving ? "Guardando..." : "Guardar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeviceDialogProps { open: boolean; device: DispositivoAsistencia | null; onOpenChange: (open: boolean) => void; onSave: (payload: DispositivoRequest) => Promise<boolean> }
const emptyDevice: DispositivoRequest = { numeroSerie: "", nombre: "", idSucursal: 0, estado: "ACTIVO" }

export function DispositivoDialog({ open, device, onOpenChange, onSave }: DeviceDialogProps) {
  const [form, setForm] = useState<DispositivoRequest>(emptyDevice)
  const [saving, setSaving] = useState(false)
  const sucursales = useSucursalOptions(open)
  useEffect(() => { if (open) setForm(device ? { numeroSerie: device.numeroSerie, nombre: device.nombre, idSucursal: device.idSucursal, estado: device.estado } : emptyDevice) }, [device, open])
  const options = useMemo<ComboboxOption[]>(() => [...(form.idSucursal > 0 && !sucursales.sucursalOptions.some((item) => item.value === String(form.idSucursal)) ? [sucursales.getSucursalOptionById(form.idSucursal, device?.sucursal)] : []), ...sucursales.sucursalOptions], [device?.sucursal, form.idSucursal, sucursales])
  const valid = !!form.numeroSerie.trim() && !!form.nombre.trim() && form.idSucursal > 0
  async function save() { if (!valid) return; setSaving(true); try { if (await onSave({ ...form, numeroSerie: form.numeroSerie.trim(), nombre: form.nombre.trim() })) onOpenChange(false) } finally { setSaving(false) } }
  return <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}><DialogContent className="sm:max-w-[560px]"><DialogHeader><DialogTitle>{device ? "Editar dispositivo" : "Nuevo dispositivo"}</DialogTitle><DialogDescription>Registra el numero de serie informado por el equipo ZKTeco.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><Field label="Numero de serie"><Input value={form.numeroSerie} maxLength={80} onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })} /></Field><Field label="Nombre"><Input value={form.nombre} maxLength={100} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field><Field label="Sucursal"><Combobox value={form.idSucursal ? String(form.idSucursal) : ""} options={options} searchValue={sucursales.searchSucursal} onSearchValueChange={sucursales.setSearchSucursal} onValueChange={(value) => setForm({ ...form, idSucursal: Number(value) })} loading={sucursales.loadingSucursales} /></Field>{device ? <div className="flex items-center justify-between rounded-lg border px-3 py-2"><span className="text-sm font-medium">Dispositivo activo</span><Switch checked={form.estado === "ACTIVO"} onCheckedChange={(checked) => setForm({ ...form, estado: (checked ? "ACTIVO" : "INACTIVO") as EstadoRegistro })} /></div> : null}</div><DialogFooter><DialogClose asChild><Button variant="outline" disabled={saving}>Cancelar</Button></DialogClose><Button disabled={!valid || saving} onClick={save}>{saving ? "Guardando..." : "Guardar"}</Button></DialogFooter></DialogContent></Dialog>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label>{label}</Label>{children}</div> }

export function DesactivarTrabajadorDialog({ worker, onOpenChange, onConfirm }: { worker: Trabajador | null; onOpenChange: (open: boolean) => void; onConfirm: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  async function confirm() { setSaving(true); try { await onConfirm() } finally { setSaving(false) } }
  return <Dialog open={worker !== null} onOpenChange={(open) => !saving && onOpenChange(open)}><DialogContent className="sm:max-w-[440px]"><DialogHeader><DialogTitle>Desactivar trabajador</DialogTitle><DialogDescription>{worker ? `Se desactivara a ${worker.nombres} ${worker.apellidos}. Sus marcaciones se conservaran.` : ""}</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline" disabled={saving}>Cancelar</Button></DialogClose><Button variant="destructive" disabled={saving} onClick={() => void confirm()}>{saving ? "Desactivando..." : "Desactivar"}</Button></DialogFooter></DialogContent></Dialog>
}
