"use client"

import type { ReactNode } from "react"
import { ArrowPathIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSucursalOptions } from "@/lib/hooks/useSucursalOptions"

export function PageHeading({ title, actionLabel, actionIcon, actionClassName = "bg-blue-600 hover:bg-blue-700", onAction, onRefresh, refreshing = false }: { title: string; actionLabel?: string; actionIcon?: ReactNode; actionClassName?: string; onAction?: () => void; onRefresh?: () => void; refreshing?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center justify-end gap-2">
        {onRefresh ? <button type="button" onClick={onRefresh} disabled={refreshing} title="Actualizar datos" aria-label="Actualizar datos" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"><ArrowPathIcon className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button> : null}
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction} className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white ${actionClassName}`}>
            {actionIcon ?? <PlusIcon className="h-4 w-4" />}{actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none" />
    </div>
  )
}

export function EstadoFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="TODOS">Todos los estados</SelectItem>
        <SelectItem value="ACTIVO">Activo</SelectItem>
        <SelectItem value="INACTIVO">Inactivo</SelectItem>
      </SelectContent>
    </Select>
  )
}

export function SucursalFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { sucursalOptions, getSucursalOptionById, loadingSucursales, searchSucursal, setSearchSucursal } = useSucursalOptions(true)
  const selectedMissing = value !== "TODAS" && !sucursalOptions.some((option) => option.value === value)
  const options: ComboboxOption[] = [
    { value: "TODAS", label: "Todas las sucursales" },
    ...(selectedMissing ? [getSucursalOptionById(Number(value))] : []),
    ...sucursalOptions,
  ]
  return <Combobox value={value} options={options} searchValue={searchSucursal} onSearchValueChange={setSearchSucursal} onValueChange={onChange} placeholder="Sucursal" searchPlaceholder="Buscar sucursal..." loading={loadingSucursales} />
}

export function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVO"
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300"}`}>{status}</span>
}

export function TableMessage({ loading, empty, colSpan }: { loading: boolean; empty: string; colSpan: number }) {
  if (loading) return <tr><td colSpan={colSpan} className="px-4 py-12"><div className="h-10 animate-pulse rounded-lg bg-muted/60" /></td></tr>
  return <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground">{empty}</td></tr>
}
