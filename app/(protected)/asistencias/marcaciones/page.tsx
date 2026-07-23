"use client"

import { useMemo, useState } from "react"
import { ArrowRightEndOnRectangleIcon, ArrowRightStartOnRectangleIcon, DocumentDuplicateIcon, ExclamationTriangleIcon, FingerPrintIcon, NoSymbolIcon, PencilSquareIcon } from "@heroicons/react/24/outline"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { PaginationResponsive } from "@/components/ui/pagination-responsive"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeading, SucursalFilter, TableMessage } from "@/components/asistencias/AsistenciaShared"
import { AnularMarcacionDialog, MarcacionManualDialog } from "@/components/asistencias/MarcacionDialogs"
import { formatDateTime, todayInLima } from "@/lib/asistencia-utils"
import { useAsistenciaPage } from "@/lib/hooks/useAsistenciaData"
import { useAsistenciaOptions } from "@/lib/hooks/useAsistenciaOptions"
import type { MarcacionAsistencia } from "@/lib/types/asistencia"

export default function MarcacionesPage() {
  const today = todayInLima()
  const [from, setFrom] = useState(`${today}T00:00`)
  const [to, setTo] = useState(`${today}T23:59`)
  const [worker, setWorker] = useState("TODOS")
  const [branch, setBranch] = useState("TODAS")
  const [device, setDevice] = useState("TODOS")
  const [link, setLink] = useState("TODAS")
  const [page, setPage] = useState(0)
  const [manualOpen, setManualOpen] = useState(false)
  const [annulTarget, setAnnulTarget] = useState<MarcacionAsistencia | null>(null)
  const workers = useAsistenciaOptions("trabajadores")
  const devices = useAsistenciaOptions("dispositivos-asistencia")
  const rangeError = markRangeError(from, to)
  const endpoint = useMemo(() => {
    if (rangeError) return ""
    const p = new URLSearchParams({ desde: `${from}:00`, hasta: `${to}:59`, page: String(page) })
    if (worker !== "TODOS") p.set("idTrabajador", worker)
    if (branch !== "TODAS") p.set("idSucursal", branch)
    if (device !== "TODOS") p.set("idDispositivo", device)
    if (link !== "TODAS") p.set("vinculacion", link)
    return `/api/asistencia/marcaciones?${p}`
  }, [branch, device, from, link, page, rangeError, to, worker])
  const data = useAsistenciaPage<MarcacionAsistencia>(endpoint)
  function filter(setter: (value: string) => void, value: string) { setter(value); setPage(0) }

  return <div className="space-y-6">
    <PageHeading title="Marcaciones" actionLabel="Nueva marcacion manual" actionIcon={<PencilSquareIcon className="h-4 w-4" />} onAction={() => setManualOpen(true)} onRefresh={data.refresh} refreshing={data.loading} />
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Input type="datetime-local" value={from} onChange={(e) => filter(setFrom, e.target.value)} />
      <Input type="datetime-local" value={to} onChange={(e) => filter(setTo, e.target.value)} />
      <Combobox value={worker} options={[{ value: "TODOS", label: "Todos los trabajadores" }, ...workers.options]} searchValue={workers.search} onSearchValueChange={workers.setSearch} onValueChange={(value) => filter(setWorker, value)} placeholder="Trabajador" loading={workers.loading} />
      <SucursalFilter value={branch} onChange={(value) => filter(setBranch, value)} />
      <Combobox value={device} options={[{ value: "TODOS", label: "Todos los dispositivos" }, ...devices.options]} searchValue={devices.search} onSearchValueChange={devices.setSearch} onValueChange={(value) => filter(setDevice, value)} placeholder="Dispositivo" loading={devices.loading} />
      <Select value={link} onValueChange={(value) => filter(setLink, value)}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODAS">Todas las marcaciones</SelectItem><SelectItem value="VINCULADA">Vinculadas</SelectItem><SelectItem value="SIN_VINCULAR">Sin vincular</SelectItem></SelectContent></Select>
    </div>
    {rangeError ? <p className="text-sm text-red-500">{rangeError}</p> : data.error ? <p className="text-sm text-red-500">{data.error}</p> : null}
    <div className="overflow-hidden rounded-lg border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead><tr className="border-b bg-muted/50"><Th>Fecha y hora</Th><Th>Trabajador</Th><Th>Tipo</Th><Th>Origen</Th><Th>Sucursal / dispositivo</Th><Th>Estado</Th><Th>Accion</Th></tr></thead><tbody>
      {data.loading || data.content.length === 0 ? <TableMessage loading={data.loading} empty="No se encontraron marcaciones" colSpan={7} /> : data.content.map((mark) => <MarkRow key={mark.idMarcacion} mark={mark} onAnnul={() => setAnnulTarget(mark)} />)}
    </tbody></table></div></div>
    <PaginationResponsive totalElements={data.totalElements} totalPages={data.totalPages} page={page} onPageChange={setPage} itemLabel="marcaciones" />
    <MarcacionManualDialog open={manualOpen} onOpenChange={setManualOpen} onSaved={data.refresh} />
    <AnularMarcacionDialog mark={annulTarget} onOpenChange={(open) => !open && setAnnulTarget(null)} onSaved={data.refresh} />
  </div>
}

function MarkRow({ mark, onAnnul }: { mark: MarcacionAsistencia; onAnnul: () => void }) {
  const TypeIcon = mark.tipoEvento === "ENTRADA" ? ArrowRightEndOnRectangleIcon : mark.tipoEvento === "SALIDA" ? ArrowRightStartOnRectangleIcon : FingerPrintIcon
  const status = markStatus(mark.estadoCalculo)
  const StatusIcon = status.icon
  return <tr className={`border-b last:border-0 hover:bg-muted/30 ${mark.estadoCalculo === "ANULADA" ? "opacity-60" : ""}`}>
    <Td><DateTime value={mark.fechaHora} /></Td>
    <Td><div className="min-w-[210px]"><span className="block font-medium">{mark.trabajador ?? "Sin vincular"}</span><span className="font-mono text-xs text-muted-foreground">Codigo {mark.codigoZkteco}</span></div></Td>
    <Td><span className="inline-flex items-center gap-1.5 font-medium"><TypeIcon className="h-4 w-4 text-blue-600" />{mark.tipoEvento ? title(mark.tipoEvento) : "Sin clasificar"}</span></Td>
    <Td><span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${mark.origen === "MANUAL" ? "bg-blue-500" : "bg-emerald-500"}`} />{mark.origen === "MANUAL" ? "Manual" : "Biometrico"}</span>{mark.usuarioRegistro ? <span className="block text-xs text-muted-foreground">por {mark.usuarioRegistro}</span> : null}</Td>
    <Td><span className="block font-medium">{mark.sucursal}</span><span className="block text-xs text-muted-foreground">{mark.dispositivo}</span></Td>
    <Td><span title={status.help} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}><StatusIcon className="h-4 w-4" />{status.label}</span>{mark.motivoAnulacion ? <span className="mt-1 block max-w-[220px] truncate text-xs text-muted-foreground" title={mark.motivoAnulacion}>{mark.motivoAnulacion}</span> : null}</Td>
    <Td>{mark.estadoCalculo !== "ANULADA" ? <button type="button" onClick={onAnnul} title="Anular marcacion" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><NoSymbolIcon className="h-5 w-5" /></button> : <span className="text-xs text-muted-foreground">Sin acciones</span>}</Td>
  </tr>
}

function markStatus(status: MarcacionAsistencia["estadoCalculo"]) {
  if (status === "DUPLICADA") return { icon: DocumentDuplicateIcon, label: "Doble huella", help: "Se conserva, pero no suma horas", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" }
  if (status === "ANULADA") return { icon: NoSymbolIcon, label: "Anulada", help: "No participa en el calculo", className: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300" }
  if (status === "REQUIERE_REVISION") return { icon: ExclamationTriangleIcon, label: "Revisar", help: "Hay mas de dos marcaciones efectivas", className: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300" }
  return { icon: FingerPrintIcon, label: "Valida", help: "Participa en el calculo", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" }
}

function title(value: string) { return value.charAt(0) + value.slice(1).toLowerCase() }
function markRangeError(from: string, to: string) { if (!from || !to) return "Selecciona las dos fechas"; if (from > to) return "La fecha final no puede ser anterior a la inicial"; const days = Math.floor((new Date(`${to.slice(0, 10)}T12:00:00`).getTime() - new Date(`${from.slice(0, 10)}T12:00:00`).getTime()) / 86_400_000) + 1; return days > 31 ? "El rango maximo es de 31 dias" : null }
function DateTime({ value }: { value: string }) { const [date, ...time] = formatDateTime(value).split(", "); return <span className="block whitespace-nowrap"><span className="block font-medium">{date}</span><span className="block text-xs text-muted-foreground">{time.join(", ") || "-"}</span></span> }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">{children}</th> }
function Td({ children }: { children: React.ReactNode }) { return <td className="whitespace-nowrap px-4 py-3 align-middle">{children}</td> }
