"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightOnRectangleIcon,
  CheckIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  EyeIcon,
  FunnelIcon,
  MapPinIcon,
  MinusIcon,
  MoonIcon,
  QuestionMarkCircleIcon,
  PencilSquareIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationResponsive } from "@/components/ui/pagination-responsive";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PageHeading,
  SearchInput,
  TableMessage,
} from "@/components/asistencias/AsistenciaShared";
import { formatDurationSeconds, formatMinutes, todayInLima } from "@/lib/asistencia-utils";
import { AsistenciaExcelDialog } from "@/components/asistencias/AsistenciaExcelDialog";
import { MarcacionManualDialog } from "@/components/asistencias/MarcacionDialogs";
import { useAsistenciaPage } from "@/lib/hooks/useAsistenciaData";
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions";
import type {
  ResumenAsistencia,
  ResumenSemanalAsistencia,
} from "@/lib/types/asistencia";

const STATUS = [
  "PRESENTE",
  "TARDANZA",
  "SALIDA_ANTICIPADA",
  "FALTA",
  "INCOMPLETA",
  "REGISTRO_INCOMPLETO",
  "EN_CURSO",
  "PENDIENTE",
  "DESCANSO",
  "TRABAJO_EN_DESCANSO",
  "REGISTRO_UNICO",
  "REQUIERE_REVISION",
  "SIN_REGISTRO",
];
const DAY_NAMES = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mondayOf(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toInputDate(date);
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toInputDate(date);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`.toUpperCase();
}

export default function ResumenPage() {
  const [view, setView] = useState("asistencia");
  const [week, setWeek] = useState(() => mondayOf(todayInLima()));
  const [branch, setBranch] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [page, setPage] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const { sucursalOptions, loadingSucursales } = useSucursalOptions(true);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const selectedBranch = branch || sucursalOptions[0]?.value || "";
  const weekEnd = addDays(week, 6);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(week, index)),
    [week],
  );
  const endpoint = useMemo(() => {
    if (!selectedBranch) return "";
    const params = new URLSearchParams({
      desde: week,
      hasta: weekEnd,
      vista: "SEMANAL",
      page: String(page),
      idSucursal: selectedBranch,
    });
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    if (status !== "TODOS") params.set("estado", status);
    return `/api/asistencia/resumen?${params}`;
  }, [debouncedSearch, page, selectedBranch, status, week, weekEnd]);
  const data = useAsistenciaPage<ResumenSemanalAsistencia>(endpoint);

  function filter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(0);
  }

  function moveWeek(offset: number) {
    setWeek((current) => addDays(current, offset * 7));
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Resumen semanal de asistencias"
        actionLabel="Exportar Excel"
        actionIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
        actionClassName="bg-emerald-600 hover:bg-emerald-700"
        onAction={() => setExportOpen(true)}
        onRefresh={data.refresh}
        refreshing={data.loading}
      />
      <AsistenciaExcelDialog
        key={`${week}-${selectedBranch}`}
        open={exportOpen}
        onOpenChange={setExportOpen}
        branch={selectedBranch}
        branches={sucursalOptions}
        status={status}
        week={week}
        weekEnd={weekEnd}
        search={search}
      />
      <Tabs value={view} onValueChange={setView}>
        <div className="space-y-4 rounded-lg border bg-card p-3 shadow-sm">
          <FilterLabel icon={<BuildingStorefrontIcon className="h-4 w-4" />}>
            Sucursal
          </FilterLabel>
          <Tabs value={selectedBranch} onValueChange={(value) => filter(setBranch, value)}>
            <TabsList className="h-auto min-h-10 w-full justify-start overflow-x-auto border bg-muted/60 p-1">
              {loadingSucursales && sucursalOptions.length === 0 ? (
                <TabsTrigger value="loading" disabled>
                  <ClockIcon className="h-4 w-4" />
                  Cargando sucursales...
                </TabsTrigger>
              ) : (
                sucursalOptions.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="min-w-fit px-4 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    {option.label}
                  </TabsTrigger>
                ))
              )}
            </TabsList>
          </Tabs>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1.5">
              <FilterLabel icon={<CalendarDaysIcon className="h-4 w-4" />}>
                Semana
              </FilterLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Semana anterior"
                  onClick={() => moveWeek(-1)}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={week}
                  onChange={(event) =>
                    event.target.value &&
                    filter(setWeek, mondayOf(event.target.value))
                  }
                  aria-label="Seleccionar semana"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Semana siguiente"
                  onClick={() => moveWeek(1)}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <FilterLabel icon={<UserGroupIcon className="h-4 w-4" />}>
                Empleado
              </FilterLabel>
              <SearchInput
                value={search}
                onChange={(value) => filter(setSearch, value)}
                placeholder="Buscar empleado..."
              />
            </div>
            <div className="space-y-1.5">
              <FilterLabel icon={<FunnelIcon className="h-4 w-4" />}>
                Estado
              </FilterLabel>
              <Select
                value={status}
                onValueChange={(value) => filter(setStatus, value)}
              >
                <SelectTrigger className="h-10 w-full">
                  <FunnelIcon className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  {STATUS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Semana del {formatDay(week)} al {formatDay(weekEnd)}
        </p>
        {data.error ? (
          <p className="text-sm text-red-500">{data.error}</p>
        ) : null}
        <div className="flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Vista del resumen</h2>
          </div>
          <TabsList className="h-10 w-full border bg-muted/60 p-1 sm:w-auto">
            <TabsTrigger
              value="asistencia"
              className="min-w-0 px-4 data-[state=active]:text-emerald-700 sm:min-w-36 dark:data-[state=active]:text-emerald-300"
            >
              <CheckIcon className="h-4 w-4" />
              Asistencia
            </TabsTrigger>
            <TabsTrigger
              value="horas"
              className="min-w-0 px-4 data-[state=active]:text-blue-700 sm:min-w-44 dark:data-[state=active]:text-blue-300"
            >
              <ClockIcon className="h-4 w-4" />
              Horas
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="asistencia" className="space-y-3">
          <StatusLegend />
          <WeeklyTable data={data} days={days} mode="status" />
        </TabsContent>
        <TabsContent value="horas">
          <WeeklyTable data={data} days={days} mode="hours" />
        </TabsContent>
      </Tabs>
      <PaginationResponsive
        totalElements={data.totalElements}
        totalPages={data.totalPages}
        page={page}
        onPageChange={setPage}
        itemLabel="trabajadores"
      />
    </div>
  );
}

function WeeklyTable({
  data,
  days,
  mode,
}: {
  data: ReturnType<typeof useAsistenciaPage<ResumenSemanalAsistencia>>;
  days: string[];
  mode: "status" | "hours";
}) {
  const showHours = mode === "hours";
  const [detail, setDetail] = useState<{
    day: ResumenAsistencia;
    worker: string;
  } | null>(null);
  const [manualDefaults, setManualDefaults] = useState<{
    idTrabajador: number;
    idSucursal?: number;
    fecha: string;
    tipoEvento: "ENTRADA" | "SALIDA";
  } | null>(null);
  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
        <table
          className={`w-full text-sm ${showHours ? "min-w-[1020px]" : "min-w-[900px]"}`}
        >
          <thead>
            <tr className="border-b bg-muted/50">
              <Th>Codigo</Th>
              <Th>Trabajador</Th>
              {days.map((day, index) => (
                <Th key={day} centered muted={index > 4}>
                  <span className="block">{DAY_NAMES[index]}</span>
                  <span className="mt-0.5 block font-normal normal-case">
                    {formatDay(day)}
                  </span>
                </Th>
              ))}
              {showHours ? <Th centered>Total semanal</Th> : null}
            </tr>
          </thead>
          <tbody>
            {data.loading || data.content.length === 0 ? (
              <TableMessage
                loading={data.loading}
                empty="No se encontraron asistencias en esta semana"
                colSpan={showHours ? 10 : 9}
              />
            ) : (
              data.content.map((row) => {
                const byDate = new Map(row.dias.map((day) => [day.fecha, day]));
                const visitedBranches = Array.from(
                  new Set(
                    row.dias.flatMap((day) =>
                      day.sucursalesMarcacion.map((item) => item.sucursal),
                    ),
                  ),
                );
                const totalSeconds = row.dias.reduce(
                  (total, day) => total + day.segundosTrabajados,
                  0,
                );
                return (
                  <tr
                    key={row.idTrabajador}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <Td>
                      <span className="font-mono text-xs">
                        {row.codigoZkteco}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex min-w-[240px] items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          {initials(row.trabajador)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {row.trabajador}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {visitedBranches.length > 0
                              ? `${visitedBranches.join(" + ")} - `
                              : row.sucursal
                                ? `Base: ${row.sucursal} - `
                                : "Sin sucursal base - "}
                            {row.turno ?? "Sin turno"}
                            {row.rotativo ? " - Rotativo" : ""}
                          </span>
                        </span>
                      </div>
                    </Td>
                    {days.map((day, index) =>
                      showHours ? (
                        <HoursCell
                          key={day}
                          day={byDate.get(day)}
                          muted={index > 4}
                          onView={(selected) =>
                            setDetail({ day: selected, worker: row.trabajador })
                          }
                        />
                      ) : (
                        <StatusCell
                          key={day}
                          day={byDate.get(day)}
                          muted={index > 4}
                          onView={(selected) =>
                            setDetail({ day: selected, worker: row.trabajador })
                          }
                        />
                      ),
                    )}
                    {showHours ? (
                      <td className="whitespace-nowrap border-l px-4 py-3 text-center font-semibold text-blue-700 dark:text-blue-300">
                        {formatDurationSeconds(totalSeconds)}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
      <AttendanceDetailDialog
        detail={detail}
        onOpenChange={(open) => !open && setDetail(null)}
        onManual={(day) => {
          setManualDefaults({
            idTrabajador: day.idTrabajador,
            idSucursal: day.sesiones[0]?.idSucursal ?? day.idSucursal ?? undefined,
            fecha: day.fecha,
            tipoEvento: day.cantidadMarcaciones === 0 ? "ENTRADA" : "SALIDA",
          });
          setDetail(null);
        }}
      />
      <MarcacionManualDialog
        open={manualDefaults !== null}
        defaults={manualDefaults ?? undefined}
        onOpenChange={(open) => !open && setManualDefaults(null)}
        onSaved={data.refresh}
      />
    </>
  );
}

function StatusLegend() {
  const items = [
    { icon: CheckCircleIcon, label: "Presente", className: "text-emerald-700 dark:text-emerald-300" },
    { icon: ExclamationTriangleIcon, label: "Tardanza", className: "text-amber-700 dark:text-amber-300" },
    { icon: ArrowRightOnRectangleIcon, label: "Salida anticipada", className: "text-orange-700 dark:text-orange-300" },
    { icon: XCircleIcon, label: "Falta", className: "text-red-700 dark:text-red-300" },
    { icon: ExclamationTriangleIcon, label: "Registro incompleto", className: "text-red-700 dark:text-red-300" },
    { icon: ExclamationTriangleIcon, label: "Requiere revision", className: "text-red-700 dark:text-red-300" },
    { icon: QuestionMarkCircleIcon, label: "Falta salida", className: "text-amber-700 dark:text-amber-300" },
    { icon: ClockIcon, label: "En curso", className: "text-blue-700 dark:text-blue-300" },
    { icon: ClockIcon, label: "Pendiente", className: "text-slate-600 dark:text-slate-300" },
    { icon: MoonIcon, label: "Descanso", className: "text-violet-700 dark:text-violet-300" },
    { icon: CheckCircleIcon, label: "Trabajo en descanso", className: "text-cyan-700 dark:text-cyan-300" },
    { icon: QuestionMarkCircleIcon, label: "Sin registro", className: "text-slate-600 dark:text-slate-300" },
    { icon: MinusIcon, label: "Día futuro", className: "text-slate-500" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">Estados</span>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <span key={item.label} className={`inline-flex items-center gap-1.5 ${item.className}`}>
            <Icon className="h-4 w-4" />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

function HoursCell({
  day,
  muted,
  onView,
}: {
  day?: ResumenAsistencia;
  muted: boolean;
  onView: (day: ResumenAsistencia) => void;
}) {
  const hasWorkedTime =
    day &&
    day.segundosTrabajados > 0;
  const details = day
    ? `${day.estado.replaceAll("_", " ")} - ${day.cantidadMarcaciones} marcas${hasWorkedTime ? ` - ${formatDurationSeconds(day.segundosTrabajados)}` : ""}${sessionDetails(day)}`
    : "Sin registro";
  return (
    <td
      title={details}
      className={`whitespace-nowrap px-3 py-4 text-center ${muted ? "bg-muted/20" : ""} ${hasWorkedTime ? "font-medium" : "text-muted-foreground/50"}`}
    >
      {day ? (
        <button
          type="button"
          onClick={() => onView(day)}
          aria-label={`Ver detalle de ${day.fecha}`}
          className="group relative inline-flex min-h-8 min-w-16 items-center justify-center rounded-md px-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0">
            {hasWorkedTime ? formatDurationSeconds(day.segundosTrabajados) : "-"}
          </span>
          <EyeIcon className="absolute h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        </button>
      ) : (
        "-"
      )}
    </td>
  );
}

function StatusCell({
  day,
  muted,
  onView,
}: {
  day?: ResumenAsistencia;
  muted: boolean;
  onView: (day: ResumenAsistencia) => void;
}) {
  if (!day)
    return (
      <td className={`px-3 py-4 text-center ${muted ? "bg-muted/20" : ""}`}>
        <MinusIcon className="mx-auto h-4 w-4 text-muted-foreground/40" />
      </td>
    );
  const visual = attendanceVisual(day);
  const Icon = visual.icon;
  const details = `${visual.label}${day.primeraMarcacion ? ` - Primera ${day.primeraMarcacion.slice(11, 16)}` : ""}${day.ultimaMarcacion ? ` - Ultima ${day.ultimaMarcacion.slice(11, 16)}` : ""} - ${day.cantidadMarcaciones} marcas${sessionDetails(day)}`;
  return (
    <td className={`px-3 py-4 text-center ${muted ? "bg-muted/20" : ""}`}>
      <button
        type="button"
        title={details}
        aria-label={details}
        onClick={() => onView(day)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${visual.className}`}
      >
        <Icon className="h-5 w-5 stroke-[2.25]" />
      </button>
    </td>
  );
}

function attendanceVisual(day: ResumenAsistencia) {
  if (day.fecha > todayInLima() && day.cantidadMarcaciones === 0)
    return {
      icon: MinusIcon,
      label: "Día futuro",
      className: "text-slate-400",
    };
  if (day.salidaAnticipada)
    return {
      icon: ArrowRightOnRectangleIcon,
      label: `Salida anticipada (${formatMinutes(day.minutosSalidaAnticipada)})`,
      className: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    };
  if (day.estado === "PRESENTE")
    return {
      icon: CheckCircleIcon,
      label: "Asistencia registrada",
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    };
  if (day.estado === "TARDANZA")
    return {
      icon: ExclamationTriangleIcon,
      label: `Tardanza (${formatMinutes(day.minutosTardanza)})`,
      className: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    };
  if (day.estado === "FALTA")
    return {
      icon: XCircleIcon,
      label: "Falta",
      className: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    };
  if (day.estado === "INCOMPLETA" || day.estado === "REGISTRO_INCOMPLETO")
    return {
      icon: ExclamationTriangleIcon,
      label: "Registro incompleto",
      className: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    };
  if (day.estado === "REQUIERE_REVISION")
    return {
      icon: ExclamationTriangleIcon,
      label: "Mas de dos marcaciones: requiere revision",
      className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
    };
  if (day.estado === "REGISTRO_UNICO")
    return {
      icon: QuestionMarkCircleIcon,
      label: "Falta registrar salida",
      className: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    };
  if (day.estado === "EN_CURSO")
    return {
      icon: ClockIcon,
      label: "Jornada en curso",
      className: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    };
  if (day.estado === "PENDIENTE")
    return {
      icon: ClockIcon,
      label: "Pendiente de marcación",
      className: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
    };
  if (day.estado === "DESCANSO")
    return {
      icon: MoonIcon,
      label: "Día de descanso",
      className: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    };
  if (day.estado === "TRABAJO_EN_DESCANSO")
    return {
      icon: CheckCircleIcon,
      label: "Trabajo en descanso",
      className: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
    };
  if (day.estado === "SIN_REGISTRO")
    return {
      icon: QuestionMarkCircleIcon,
      label: "Sin registro",
      className: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
    };
  return { icon: MinusIcon, label: "Sin información", className: "text-slate-400" };
}

function AttendanceDetailDialog({
  detail,
  onOpenChange,
  onManual,
}: {
  detail: { day: ResumenAsistencia; worker: string } | null;
  onOpenChange: (open: boolean) => void;
  onManual: (day: ResumenAsistencia) => void;
}) {
  const day = detail?.day;
  const visual = day ? attendanceVisual(day) : null;
  const StatusIcon = visual?.icon;
  return (
    <Dialog open={detail !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{detail?.worker}</DialogTitle>
          <DialogDescription>
            {day ? `${formatFullDate(day.fecha)} - ${day.cantidadMarcaciones} marcaciones` : ""}
          </DialogDescription>
        </DialogHeader>
        {day ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm">
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-medium ${visual?.className}`}>
                {StatusIcon ? <StatusIcon className="h-4 w-4" /> : null}
                {visual?.label}
              </span>
              <span className="text-muted-foreground">
                Total: {day.segundosTrabajados > 0 ? formatDurationSeconds(day.segundosTrabajados) : "Pendiente"}
              </span>
            </div>
            {day.cantidadMarcaciones < 2 && day.fecha <= todayInLima() ? (
              <Button type="button" className="w-full" onClick={() => onManual(day)}>
                <PencilSquareIcon className="h-4 w-4" />
                Registrar {day.cantidadMarcaciones === 0 ? "entrada" : "salida"} manual
              </Button>
            ) : null}
            {day.estado === "REQUIERE_REVISION" ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                No se calcularon horas. Anula las marcaciones incorrectas desde la pantalla Marcaciones.
              </p>
            ) : null}
            {day.horaProgramadaEntrada || day.horaProgramadaSalida ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="block text-xs font-medium uppercase text-muted-foreground">Entrada programada</span>
                  <span className="font-medium">{day.horaProgramadaEntrada?.slice(0, 5) ?? "No definida"}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium uppercase text-muted-foreground">Salida programada</span>
                  <span className="font-medium">{day.horaProgramadaSalida?.slice(0, 5) ?? "No definida"}</span>
                </div>
              </div>
            ) : null}
            {day.sesiones.length > 0 ? (
              <div className="divide-y">
                {day.sesiones.map((session, index) => (
                  <div key={`${session.idSucursal}-${session.entrada}-${index}`} className="py-4 first:pt-0 last:pb-0">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2 font-medium">
                        <MapPinIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="truncate">{session.sucursal}</span>
                      </span>
                      <span className={session.completa ? "text-sm font-medium" : "text-sm text-orange-600"}>
                        {session.completa ? formatDurationSeconds(session.segundosTrabajados) : "Salida pendiente"}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <SessionMark label="Entrada" value={session.entrada} device={session.dispositivoEntrada} branch={session.sucursal} />
                      <SessionMark label="Salida" value={session.salida} device={session.dispositivoSalida} branch={session.sucursalSalida} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No hay recorrido registrado.</p>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SessionMark({ label, value, device, branch }: { label: string; value: string | null; device: string | null; branch: string | null }) {
  return (
    <div>
      <span className="block text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <span className="block font-medium">{value ? value.slice(11, 19) : "Pendiente"}</span>
      {branch ? <span className="block truncate text-xs font-medium text-foreground">{branch}</span> : null}
      <span className="block truncate text-xs text-muted-foreground">{device ?? "Sin dispositivo"}</span>
    </div>
  );
}

function FilterLabel({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
      {icon}
      {children}
    </span>
  );
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function sessionDetails(day: ResumenAsistencia) {
  if (day.sesiones.length === 0) return "";
  return day.sesiones
    .map(
      (session) =>
        `\n${session.sucursal}: ${session.entrada.slice(11, 19)}-${session.salida?.slice(11, 19) ?? "pendiente"}${session.completa ? ` (${formatDurationSeconds(session.segundosTrabajados)})` : ""}`,
    )
    .join("");
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function Th({
  children,
  centered = false,
  muted = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
  muted?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-bold uppercase text-muted-foreground ${centered ? "text-center" : "text-left"} ${muted ? "bg-muted/20" : ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3">{children}</td>;
}
