"use client"

import { useMemo, useState } from "react"
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { PaginationResponsive } from "@/components/ui/pagination-responsive"
import { PageHeading, SucursalFilter, TableMessage } from "@/components/asistencias/AsistenciaShared"
import { MetricCard } from "@/components/Card"
import { asistenciaPeriodRange, formatDurationSeconds, type AsistenciaPeriod } from "@/lib/asistencia-utils"
import { useAsistenciaData } from "@/lib/hooks/useAsistenciaData"
import { useAsistenciaOptions } from "@/lib/hooks/useAsistenciaOptions"
import type { AnalisisAsistencia } from "@/lib/types/asistencia"

const STATE_COLORS: Record<string, string> = {
  PRESENTE: "#10b981",
  TARDANZA: "#f59e0b",
  FALTA: "#ef4444",
  REGISTRO_INCOMPLETO: "#f97316",
  EN_CURSO: "#3b82f6",
  TRABAJO_EN_DESCANSO: "#06b6d4",
}

const PERIODS: Array<{ value: Exclude<AsistenciaPeriod, "RANGO">; label: string }> = [
  { value: "SEMANA_ACTUAL", label: "Semana actual" },
  { value: "SEMANA_ANTERIOR", label: "Semana anterior" },
  { value: "QUINCENA_ACTUAL", label: "Quincena actual" },
  { value: "QUINCENA_ANTERIOR", label: "Quincena anterior" },
  { value: "MES_ACTUAL", label: "Mes actual" },
  { value: "MES_ANTERIOR", label: "Mes anterior" },
]

export default function AnalisisAsistenciaPage() {
  const initial = asistenciaPeriodRange("MES_ACTUAL")
  const [period, setPeriod] = useState<AsistenciaPeriod>("MES_ACTUAL")
  const [desde, setDesde] = useState(initial.desde)
  const [hasta, setHasta] = useState(initial.hasta)
  const [worker, setWorker] = useState("TODOS")
  const [branch, setBranch] = useState("TODAS")
  const [page, setPage] = useState(0)
  const workers = useAsistenciaOptions("trabajadores")
  const rangeError = dateRangeError(desde, hasta)

  const endpoint = useMemo(() => {
    if (rangeError) return ""
    const params = new URLSearchParams({ desde, hasta, page: String(page) })
    if (worker !== "TODOS") params.set("idTrabajador", worker)
    if (branch !== "TODAS") params.set("idSucursal", branch)
    return `/api/asistencia/analisis?${params}`
  }, [branch, desde, hasta, page, rangeError, worker])
  const { data, loading, error, refresh } = useAsistenciaData<AnalisisAsistencia>(endpoint)

  function selectPeriod(value: AsistenciaPeriod) {
    setPeriod(value)
    setPage(0)
    if (value !== "RANGO") {
      const range = asistenciaPeriodRange(value)
      setDesde(range.desde)
      setHasta(range.hasta)
    }
  }

  function filter(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(0)
  }

  const workerOptions = [{ value: "TODOS", label: "Todos los trabajadores" }, ...workers.options]
  const indicators = data?.indicadores
  const distribution = (data?.distribucion ?? []).filter((item) => item.cantidad > 0)
  const branchHours = (data?.horasPorSucursal ?? []).map((item) => ({
    sucursal: item.sucursal,
    horas: Number((item.segundosTrabajados / 3600).toFixed(2)),
  }))

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeading title="Analisis de asistencias" onRefresh={refresh} refreshing={loading} />
      <section className="rounded-2xl px-0 py-1 sm:px-5 sm:py-4">
        <div className="space-y-4">
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-2">
              {PERIODS.map((option) => (
                <button key={option.value} type="button" onClick={() => selectPeriod(option.value)} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${period === option.value ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
                  {option.label}
                </button>
              ))}
              <button type="button" onClick={() => setPeriod("RANGO")} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${period === "RANGO" ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
                Rango personalizado
              </button>
            </div>
          </div>
          <div className={`grid gap-3 md:grid-cols-2 ${period === "RANGO" ? "xl:grid-cols-4" : "xl:grid-cols-2"}`}>
            {period === "RANGO" ? <>
              <Input type="date" value={desde} onChange={(event) => { setDesde(event.target.value); setPage(0) }} />
              <Input type="date" value={hasta} onChange={(event) => { setHasta(event.target.value); setPage(0) }} />
            </> : null}
            <Combobox value={worker} options={workerOptions} searchValue={workers.search} onSearchValueChange={workers.setSearch} onValueChange={(value) => filter(setWorker, value)} placeholder="Trabajador" loading={workers.loading} />
            <SucursalFilter value={branch} onChange={(value) => filter(setBranch, value)} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Periodo: <span className="font-medium text-slate-700 dark:text-slate-200">{desde} al {hasta}</span></p>
        </div>
      </section>

      {rangeError ? <p className="text-sm text-red-500">{rangeError}</p> : error ? <p className="text-sm text-red-500">{error}</p> : null}

      {loading ? <AnalysisSkeleton /> : <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard title="Trabajadores" value={String(indicators?.trabajadoresEvaluados ?? 0)} numericValue={indicators?.trabajadoresEvaluados ?? 0} formatValue={String} icon={UserGroupIcon} iconColor="text-blue-600" />
        <MetricCard title="Dias asistidos" value={String(indicators?.diasAsistidos ?? 0)} numericValue={indicators?.diasAsistidos ?? 0} formatValue={String} icon={CheckCircleIcon} iconColor="text-green-600" />
        <MetricCard title="Asistencia" value={`${indicators?.porcentajeAsistencia ?? 0}%`} numericValue={indicators?.porcentajeAsistencia ?? 0} formatValue={(value) => `${value.toFixed(1)}%`} icon={CheckCircleIcon} iconColor="text-cyan-600" />
        <MetricCard title="Horas trabajadas" value={formatDurationSeconds(indicators?.segundosTrabajados ?? 0)} numericValue={indicators?.segundosTrabajados ?? 0} formatValue={formatDurationSeconds} icon={ClockIcon} iconColor="text-purple-600" />
        <MetricCard title="Faltas" value={String(indicators?.faltas ?? 0)} numericValue={indicators?.faltas ?? 0} formatValue={String} icon={XCircleIcon} iconColor="text-red-600" />
        <MetricCard title="Tardanzas" value={String(indicators?.tardanzas ?? 0)} numericValue={indicators?.tardanzas ?? 0} formatValue={String} icon={ExclamationTriangleIcon} iconColor="text-amber-500" />
        <MetricCard title="Salidas anticipadas" value={String(indicators?.salidasAnticipadas ?? 0)} numericValue={indicators?.salidasAnticipadas ?? 0} formatValue={String} icon={ExclamationTriangleIcon} iconColor="text-orange-500" />
        <MetricCard title="Registros incompletos" value={String(indicators?.registrosIncompletos ?? 0)} numericValue={indicators?.registrosIncompletos ?? 0} formatValue={String} icon={ExclamationTriangleIcon} iconColor="text-slate-500" />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <ChartSection title="Distribucion de asistencia" description="Composicion de estados dentro del periodo seleccionado.">
          {distribution.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={distribution} dataKey="cantidad" nameKey="estado" innerRadius={62} outerRadius={100} paddingAngle={3}>
                  {distribution.map((item) => <Cell key={item.estado} fill={STATE_COLORS[item.estado]} />)}
                </Pie>
                <Tooltip />
                <Legend formatter={(value) => String(value).replaceAll("_", " ")} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartSection>

        <ChartSection title="Evolucion diaria" description="Asistencias e incidencias registradas por fecha.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.evolucion ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fecha" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(value) => shortDate(String(value))} />
              <Legend />
              <Bar dataKey="asistencias" name="Asistencias" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="tardanzas" name="Tardanzas" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="faltas" name="Faltas" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="registrosIncompletos" name="Incompletos" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      <ChartSection title="Horas por sucursal" description="Tiempo acumulado en cada sede segun las marcaciones reales.">
        {branchHours.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={Math.max(260, branchHours.length * 52)}>
            <BarChart data={branchHours} layout="vertical" margin={{ top: 5, right: 35, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" unit=" h" />
              <YAxis type="category" dataKey="sucursal" width={130} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value} h`, "Horas"]} />
              <Bar dataKey="horas" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartSection>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="px-4 pt-4 sm:px-5 sm:pt-5"><h2 className="text-sm font-semibold text-slate-900 sm:text-lg dark:text-white">Trabajadores con incidencias</h2><p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">Personas con faltas, tardanzas o registros que requieren revision.</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead><tr className="border-b bg-muted/50"><Th>Trabajador</Th><Th>Sucursal base</Th><Th center>Faltas</Th><Th center>Tardanzas</Th><Th center>Salidas</Th><Th center>Incompletos</Th><Th>Horas</Th></tr></thead>
            <tbody>
              {loading || !data?.trabajadores.content.length ? <TableMessage loading={loading} empty="No se encontraron incidencias" colSpan={7} /> : data.trabajadores.content.map((item) => (
                <tr key={item.idTrabajador} className="border-b last:border-0 hover:bg-muted/30">
                  <Td><div className="flex min-w-[220px] items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{initials(item.trabajador)}</span><span><span className="block font-medium">{item.trabajador}</span><span className="block font-mono text-xs text-muted-foreground">Codigo {item.codigoZkteco}</span></span></div></Td>
                  <Td>{item.sucursal ?? "Sin sucursal base"}</Td>
                  <Td center>{item.faltas}</Td><Td center>{item.tardanzas}</Td><Td center>{item.salidasAnticipadas}</Td><Td center>{item.registrosIncompletos}</Td><Td>{formatDurationSeconds(item.segundosTrabajados)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <PaginationResponsive totalElements={data?.trabajadores.totalElements ?? 0} totalPages={data?.trabajadores.totalPages ?? 0} page={page} onPageChange={setPage} itemLabel="trabajadores" />
      </>}
    </div>
  )
}

function AnalysisSkeleton() {
  return <div className="space-y-4 sm:space-y-6" aria-label="Cargando analisis" aria-busy="true">
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-lg border bg-muted/50" />)}
    </div>
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="h-[380px] animate-pulse rounded-lg border bg-muted/50" />
      <div className="h-[380px] animate-pulse rounded-lg border bg-muted/50" />
    </div>
    <div className="h-[340px] animate-pulse rounded-lg border bg-muted/50" />
    <div className="overflow-hidden rounded-lg border"><div className="h-16 animate-pulse border-b bg-muted/50" />{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-14 animate-pulse border-b bg-muted/30 last:border-0" />)}</div>
  </div>
}

function ChartSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900/60"><div className="mb-3 space-y-0.5 sm:mb-4 sm:space-y-1"><h2 className="text-sm font-semibold text-slate-900 sm:text-lg dark:text-white">{title}</h2><p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">{description}</p></div>{children}</section>
}

function EmptyChart() {
  return <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">Sin datos para el periodo</div>
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`.toUpperCase()
}

function shortDate(value: string) {
  const [, month, day] = value.split("-")
  return day && month ? `${day}/${month}` : value
}

function dateRangeError(desde: string, hasta: string) {
  if (!desde || !hasta) return "Selecciona las dos fechas"
  if (hasta < desde) return "La fecha final no puede ser anterior a la inicial"
  const days = Math.floor((new Date(`${hasta}T12:00:00`).getTime() - new Date(`${desde}T12:00:00`).getTime()) / 86_400_000) + 1
  return days > 31 ? "El rango máximo es de 31 días" : null
}

function Th({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return <th className={`px-4 py-3 text-xs font-bold uppercase text-muted-foreground ${center ? "text-center" : "text-left"}`}>{children}</th>
}

function Td({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return <td className={`whitespace-nowrap px-4 py-3 ${center ? "text-center" : ""}`}>{children}</td>
}
