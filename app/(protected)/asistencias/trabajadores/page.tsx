"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseIcon, PencilSquareIcon, TrashIcon, UsersIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  DesactivarTrabajadorDialog,
  TrabajadorDialog,
} from "@/components/asistencias/RegistroDialogs";
import {
  EstadoFilter,
  PageHeading,
  SearchInput,
  StatusBadge,
  SucursalFilter,
  TableMessage,
} from "@/components/asistencias/AsistenciaShared";
import { PaginationResponsive } from "@/components/ui/pagination-responsive";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  asistenciaMutation,
  useAsistenciaPage,
} from "@/lib/hooks/useAsistenciaData";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { CargoRequest, CargoTrabajador, Trabajador, TrabajadorRequest } from "@/lib/types/asistencia";

export default function TrabajadoresPage() {
  const [tab, setTab] = useState("trabajadores");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("TODAS");
  const [status, setStatus] = useState("TODOS");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState<Trabajador | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Trabajador | null>(
    null,
  );
  const debounced = useDebouncedValue(search, 350, () => setPage(0));
  const endpoint = useMemo(() => {
    const p = new URLSearchParams({ page: String(page) });
    if (debounced.trim()) p.set("q", debounced.trim());
    if (branch !== "TODAS") p.set("idSucursal", branch);
    if (status !== "TODOS") p.set("estado", status);
    return `/api/trabajadores?${p}`;
  }, [branch, debounced, page, status]);
  const data = useAsistenciaPage<Trabajador>(endpoint);
  const [cargoSearch, setCargoSearch] = useState("");
  const [cargoStatus, setCargoStatus] = useState("TODOS");
  const [cargoPage, setCargoPage] = useState(0);
  const [cargoDialogOpen, setCargoDialogOpen] = useState(false);
  const [cargoTarget, setCargoTarget] = useState<CargoTrabajador | null>(null);
  const [cargoStateTarget, setCargoStateTarget] = useState<CargoTrabajador | null>(null);
  const cargoDebounced = useDebouncedValue(cargoSearch, 350, () => setCargoPage(0));
  const cargoEndpoint = useMemo(() => {
    const params = new URLSearchParams({ page: String(cargoPage) });
    if (cargoDebounced.trim()) params.set("q", cargoDebounced.trim());
    if (cargoStatus !== "TODOS") params.set("estado", cargoStatus);
    return `/api/asistencia/cargos?${params}`;
  }, [cargoDebounced, cargoPage, cargoStatus]);
  const cargos = useAsistenciaPage<CargoTrabajador>(cargoEndpoint);

  function changeBranch(value: string) {
    setBranch(value);
    setPage(0);
  }
  function changeStatus(value: string) {
    setStatus(value);
    setPage(0);
  }
  function openCreate() {
    setTarget(null);
    setDialogOpen(true);
  }
  function openEdit(worker: Trabajador) {
    setTarget(worker);
    setDialogOpen(true);
  }
  async function save(payload: TrabajadorRequest) {
    const result = await asistenciaMutation<Trabajador>(
      target ? `/api/trabajadores/${target.idTrabajador}` : "/api/trabajadores",
      target ? "PUT" : "POST",
      payload,
    );
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    toast.success(target ? "Trabajador actualizado" : "Trabajador registrado");
    data.refresh();
    return true;
  }
  async function deactivate() {
    if (!deactivateTarget) return;
    const result = await asistenciaMutation(
      `/api/trabajadores/${deactivateTarget.idTrabajador}`,
      "DELETE",
    );
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Trabajador desactivado");
    setDeactivateTarget(null);
    data.refresh();
  }

  function openCargoCreate() {
    setCargoTarget(null);
    setCargoDialogOpen(true);
  }
  function openCargoEdit(cargo: CargoTrabajador) {
    setCargoTarget(cargo);
    setCargoDialogOpen(true);
  }
  async function saveCargo(payload: CargoRequest) {
    const result = await asistenciaMutation<CargoTrabajador>(
      cargoTarget ? `/api/asistencia/cargos/${cargoTarget.idCargo}` : "/api/asistencia/cargos",
      cargoTarget ? "PUT" : "POST",
      payload,
    );
    if (!result.ok) { toast.error(result.message); return false; }
    toast.success(cargoTarget ? "Cargo actualizado" : "Cargo registrado");
    cargos.refresh();
    return true;
  }
  async function changeCargoState() {
    if (!cargoStateTarget) return;
    const next = cargoStateTarget.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const result = await asistenciaMutation<CargoTrabajador>(
      `/api/asistencia/cargos/${cargoStateTarget.idCargo}/estado`, "PATCH", { estado: next });
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(next === "ACTIVO" ? "Cargo activado" : "Cargo desactivado");
    setCargoStateTarget(null);
    cargos.refresh();
    data.refresh();
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <PageHeading
        title="Trabajadores"
        actionLabel={tab === "trabajadores" ? "Nuevo trabajador" : "Nuevo cargo"}
        onAction={tab === "trabajadores" ? openCreate : openCargoCreate}
        onRefresh={tab === "trabajadores" ? data.refresh : cargos.refresh}
        refreshing={tab === "trabajadores" ? data.loading : cargos.loading}
      />
      <TabsList><TabsTrigger value="trabajadores"><UsersIcon />Trabajadores</TabsTrigger><TabsTrigger value="cargos"><BriefcaseIcon />Cargos</TabsTrigger></TabsList>
      <TabsContent value="trabajadores" className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, DNI o codigo..."
        />
        <SucursalFilter value={branch} onChange={changeBranch} />
        <EstadoFilter value={status} onChange={changeStatus} />
      </div>
      {data.error ? <p className="text-sm text-red-500">{data.error}</p> : null}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <Th>Codigo</Th>
                <Th>Trabajador</Th>
                <Th>DNI</Th>
                <Th>Sucursal base</Th>
                <Th>Turno</Th>
                <Th>Cargo</Th>
                <Th>Tipo</Th>
                <Th>Estado</Th>
                <Th center>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {data.loading || data.content.length === 0 ? (
                <TableMessage
                  loading={data.loading}
                  empty="No se encontraron trabajadores"
                  colSpan={9}
                />
              ) : (
                data.content.map((worker) => (
                  <tr
                    key={worker.idTrabajador}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <Td>{worker.codigoZkteco}</Td>
                    <Td>
                      <div className="flex min-w-[220px] items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          {initials(worker.nombres, worker.apellidos)}
                        </span>
                        <span className="font-medium">
                          {worker.apellidos}, {worker.nombres}
                        </span>
                      </div>
                    </Td>
                    <Td>{worker.dni}</Td>
                      <Td>
                        {worker.sucursal ?? (
                          <span className="text-muted-foreground">Sin sucursal base</span>
                        )}
                      </Td>
                    <Td>
                      {worker.turno ?? (
                        <span className="text-muted-foreground">Sin turno</span>
                      )}
                    </Td>
                    <Td>{worker.cargo ?? <span className="text-muted-foreground">Sin cargo</span>}</Td>
                    <Td>
                      {worker.rotativo ? (
                        <span className="font-medium text-blue-600 dark:text-blue-300">
                          Rotativo
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Fijo</span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge status={worker.estado} />
                    </Td>
                    <Td center>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"
                        title="Editar trabajador"
                        onClick={() => openEdit(worker)}
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40"
                        title="Desactivar trabajador"
                        disabled={worker.estado === "INACTIVO"}
                        onClick={() => setDeactivateTarget(worker)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <PaginationResponsive
        totalElements={data.totalElements}
        totalPages={data.totalPages}
        page={page}
        onPageChange={setPage}
        itemLabel="trabajadores"
      />
      </TabsContent>
      <TabsContent value="cargos" className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2"><SearchInput value={cargoSearch} onChange={setCargoSearch} placeholder="Buscar cargo..." /><EstadoFilter value={cargoStatus} onChange={(value) => { setCargoStatus(value); setCargoPage(0); }} /></div>
        {cargos.error ? <p className="text-sm text-red-500">{cargos.error}</p> : null}
        <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b bg-muted/50"><Th>Cargo</Th><Th>Estado</Th><Th center>Acciones</Th></tr></thead><tbody>{cargos.loading || cargos.content.length === 0 ? <TableMessage loading={cargos.loading} empty="No se encontraron cargos" colSpan={3} /> : cargos.content.map((cargo) => <tr key={cargo.idCargo} className="border-b last:border-0 hover:bg-muted/30"><Td><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><BriefcaseIcon className="h-5 w-5" /></span><span className="font-medium">{cargo.nombre}</span></div></Td><Td><StatusBadge status={cargo.estado} /></Td><Td center><button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50" title="Editar cargo" onClick={() => openCargoEdit(cargo)}><PencilSquareIcon className="h-4 w-4" /></button><button type="button" className={`inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium ${cargo.estado === "ACTIVO" ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`} onClick={() => setCargoStateTarget(cargo)}>{cargo.estado === "ACTIVO" ? "Desactivar" : "Activar"}</button></Td></tr>)}</tbody></table></div></div>
        <PaginationResponsive totalElements={cargos.totalElements} totalPages={cargos.totalPages} page={cargoPage} onPageChange={setCargoPage} itemLabel="cargos" />
      </TabsContent>
      <TrabajadorDialog
        open={dialogOpen}
        worker={target}
        onOpenChange={setDialogOpen}
        onSave={save}
      />
      <DesactivarTrabajadorDialog
        worker={deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        onConfirm={deactivate}
      />
      <CargoDialog open={cargoDialogOpen} cargo={cargoTarget} onOpenChange={setCargoDialogOpen} onSave={saveCargo} />
      <CargoStateDialog cargo={cargoStateTarget} onOpenChange={(open) => !open && setCargoStateTarget(null)} onConfirm={changeCargoState} />
    </Tabs>
  );
}

function CargoDialog({ open, cargo, onOpenChange, onSave }: { open: boolean; cargo: CargoTrabajador | null; onOpenChange: (open: boolean) => void; onSave: (payload: CargoRequest) => Promise<boolean> }) {
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setNombre(cargo?.nombre ?? ""); }, [cargo, open]);
  async function save() { if (!nombre.trim()) return; setSaving(true); try { if (await onSave({ nombre: nombre.trim() })) onOpenChange(false); } finally { setSaving(false); } }
  return <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}><DialogContent className="sm:max-w-[440px]"><DialogHeader><DialogTitle>{cargo ? "Editar cargo" : "Nuevo cargo"}</DialogTitle><DialogDescription>Define la funcion principal que realiza el trabajador.</DialogDescription></DialogHeader><div className="grid gap-2 py-2"><Label htmlFor="cargo-nombre">Nombre</Label><Input id="cargo-nombre" value={nombre} maxLength={100} onChange={(event) => setNombre(event.target.value)} placeholder="Ej. Modelo, Costura, Almacen" /></div><DialogFooter><DialogClose asChild><Button variant="outline" disabled={saving}>Cancelar</Button></DialogClose><Button disabled={!nombre.trim() || saving} onClick={() => void save()}>{saving ? "Guardando..." : "Guardar"}</Button></DialogFooter></DialogContent></Dialog>;
}

function CargoStateDialog({ cargo, onOpenChange, onConfirm }: { cargo: CargoTrabajador | null; onOpenChange: (open: boolean) => void; onConfirm: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const activating = cargo?.estado === "INACTIVO";
  async function confirm() { setSaving(true); try { await onConfirm(); } finally { setSaving(false); } }
  return <Dialog open={cargo !== null} onOpenChange={(open) => !saving && onOpenChange(open)}><DialogContent className="sm:max-w-[440px]"><DialogHeader><DialogTitle>{activating ? "Activar cargo" : "Desactivar cargo"}</DialogTitle><DialogDescription>{cargo ? `${activating ? "Se activara" : "Se desactivara"} el cargo ${cargo.nombre}. Los trabajadores vinculados conservaran su cargo.` : ""}</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline" disabled={saving}>Cancelar</Button></DialogClose><Button variant={activating ? "default" : "destructive"} disabled={saving} onClick={() => void confirm()}>{saving ? "Guardando..." : activating ? "Activar" : "Desactivar"}</Button></DialogFooter></DialogContent></Dialog>;
}

function initials(names: string, surnames: string) {
  return `${names.trim()[0] ?? ""}${surnames.trim()[0] ?? ""}`.toUpperCase();
}

function Th({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-bold uppercase text-muted-foreground ${center ? "text-center" : "text-left"}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <td className={`px-4 py-3 ${center ? "text-center" : ""}`}>{children}</td>
  );
}
