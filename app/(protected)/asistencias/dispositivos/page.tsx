"use client"

import { useMemo, useState } from "react"
import { ComputerDesktopIcon, PencilSquareIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"
import { DispositivoDialog } from "@/components/asistencias/RegistroDialogs"
import { EstadoFilter, PageHeading, SearchInput, StatusBadge, SucursalFilter, TableMessage } from "@/components/asistencias/AsistenciaShared"
import { PaginationResponsive } from "@/components/ui/pagination-responsive"
import { formatDateTime } from "@/lib/asistencia-utils"
import { asistenciaMutation, useAsistenciaPage } from "@/lib/hooks/useAsistenciaData"
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue"
import type { DispositivoAsistencia, DispositivoRequest } from "@/lib/types/asistencia"

export default function DispositivosPage() {
  const [search, setSearch] = useState("")
  const [branch, setBranch] = useState("TODAS")
  const [status, setStatus] = useState("TODOS")
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [target, setTarget] = useState<DispositivoAsistencia | null>(null)
  const debounced = useDebouncedValue(search, 350, () => setPage(0))
  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ page: String(page) })
    if (debounced.trim()) params.set("q", debounced.trim())
    if (branch !== "TODAS") params.set("idSucursal", branch)
    if (status !== "TODOS") params.set("estado", status)
    return `/api/dispositivos-asistencia?${params}`
  }, [branch, debounced, page, status])
  const data = useAsistenciaPage<DispositivoAsistencia>(endpoint)

  function updateFilter(setter: (value: string) => void, value: string) { setter(value); setPage(0) }
  function openCreate() { setTarget(null); setDialogOpen(true) }
  function openEdit(device: DispositivoAsistencia) { setTarget(device); setDialogOpen(true) }
  async function save(payload: DispositivoRequest) {
    const result = await asistenciaMutation<DispositivoAsistencia>(target ? `/api/dispositivos-asistencia/${target.idDispositivo}` : "/api/dispositivos-asistencia", target ? "PUT" : "POST", payload)
    if (!result.ok) { toast.error(result.message); return false }
    toast.success(target ? "Dispositivo actualizado" : "Dispositivo registrado")
    data.refresh()
    return true
  }

  return <div className="space-y-6">
    <PageHeading title="Dispositivos de asistencia" actionLabel="Nuevo dispositivo" onAction={openCreate} onRefresh={data.refresh} refreshing={data.loading} />
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_200px]"><SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o numero de serie..." /><SucursalFilter value={branch} onChange={(value) => updateFilter(setBranch, value)} /><EstadoFilter value={status} onChange={(value) => updateFilter(setStatus, value)} /></div>
    {data.error ? <p className="text-sm text-red-500">{data.error}</p> : null}
    <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b bg-muted/50"><Th>Dispositivo</Th><Th>Serie</Th><Th>Sucursal</Th><Th>Ultima conexion</Th><Th>Estado</Th><Th center>Acciones</Th></tr></thead><tbody>
      {data.loading || data.content.length === 0 ? <TableMessage loading={data.loading} empty="No se encontraron dispositivos" colSpan={6} /> : data.content.map((device) => <tr key={device.idDispositivo} className="border-b last:border-0 hover:bg-muted/30"><Td><div className="flex min-w-[180px] items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><ComputerDesktopIcon className="h-5 w-5" /></span><span className="font-medium">{device.nombre}</span></div></Td><Td>{device.numeroSerie}</Td><Td>{device.sucursal}</Td><Td>{device.ultimaConexion ? <DateTime value={device.ultimaConexion} /> : <span className="text-muted-foreground">Nunca conectado</span>}</Td><Td><StatusBadge status={device.estado} /></Td><Td center><button type="button" onClick={() => openEdit(device)} title="Editar dispositivo" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"><PencilSquareIcon className="h-4 w-4" /></button></Td></tr>)}
    </tbody></table></div></div>
    <PaginationResponsive totalElements={data.totalElements} totalPages={data.totalPages} page={page} onPageChange={setPage} itemLabel="dispositivos" />
    <DispositivoDialog open={dialogOpen} device={target} onOpenChange={setDialogOpen} onSave={save} />
  </div>
}

function DateTime({ value }: { value: string }) { const [date, ...time] = formatDateTime(value).split(", "); return <span className="block whitespace-nowrap"><span className="block font-medium">{date}</span><span className="block text-xs text-muted-foreground">{time.join(", ") || "-"}</span></span> }
function Th({ children, center = false }: { children: React.ReactNode; center?: boolean }) { return <th className={`px-4 py-3 text-xs font-bold uppercase text-muted-foreground ${center ? "text-center" : "text-left"}`}>{children}</th> }
function Td({ children, center = false }: { children: React.ReactNode; center?: boolean }) { return <td className={`px-4 py-3 ${center ? "text-center" : ""}`}>{children}</td> }
