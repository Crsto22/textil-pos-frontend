import { memo } from "react"
import {
    ChevronRightIcon,
    EnvelopeIcon,
    IdentificationIcon,
    PencilSquareIcon,
    PhoneIcon,
    TrashIcon,
} from "@heroicons/react/24/outline"

import { ClientesTableSkeleton } from "@/components/clientes/ClientesTableSkeleton"
import type { Cliente } from "@/lib/types/cliente"
import {
    estadoBadge,
    getAvatarColor,
    getInitials,
    tipoDocumentoBadge,
} from "@/components/clientes/clientes.utils"

interface ClientesTableProps {
    clientes: Cliente[]
    loading: boolean
    selectedClienteId: number | null
    onSelectCliente: (cliente: Cliente) => void
    onEditCliente: (cliente: Cliente) => void
    onDeleteCliente: (cliente: Cliente) => void
}

function ClientesTableComponent({
    clientes,
    loading,
    selectedClienteId,
    onSelectCliente,
    onEditCliente,
    onDeleteCliente,
}: ClientesTableProps) {
    if (loading) {
        return (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                <div className="space-y-3 p-3 sm:hidden">
                    {[0, 1, 2].map((item) => (
                        <div
                            key={item}
                            className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="h-4 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                    <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <div className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
                                <div className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden sm:block">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <tbody>
                                <ClientesTableSkeleton />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }

    if (clientes.length === 0) {
        return (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                <div className="px-4 py-14 text-center text-sm text-slate-400 dark:text-slate-500">
                    No se encontraron clientes
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-hidden   dark:border-slate-700/60 dark:bg-slate-800/80">
            <div className="space-y-3 p-3 sm:hidden">
                {clientes.map((cliente) => {
                    const color = getAvatarColor(cliente.idCliente)
                    const initials = getInitials(cliente.nombres)
                    const isSelected = selectedClienteId === cliente.idCliente
                    const tipoDoc =
                        tipoDocumentoBadge[cliente.tipoDocumento] ?? {
                            label: cliente.tipoDocumento,
                            cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                        }
                    const estado =
                        estadoBadge[cliente.estado] ?? {
                            label: cliente.estado,
                            dot: "bg-gray-400",
                            cls: "text-gray-600",
                        }

                    return (
                        <div
                            key={cliente.idCliente}
                            onClick={() => onSelectCliente(cliente)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    onSelectCliente(cliente)
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            className={`w-full rounded-2xl border bg-white p-4 text-left transition ${
                                isSelected
                                    ? "border-blue-200 bg-blue-50/70 shadow-[0_10px_30px_rgba(59,130,246,0.08)] dark:border-blue-500/30 dark:bg-blue-500/10"
                                    : "border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-white dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-900/70"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color.bg} ${color.text}`}
                                >
                                    {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                {cliente.nombres}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                                {cliente.correo || "Sin correo registrado"}
                                            </p>
                                        </div>
                                        <ChevronRightIcon
                                            className={`h-4 w-4 shrink-0 ${
                                                isSelected
                                                    ? "text-blue-500"
                                                    : "text-slate-300 dark:text-slate-600"
                                            }`}
                                        />
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${tipoDoc.cls}`}
                                        >
                                            {tipoDoc.label}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${estado.cls}`}
                                        >
                                            <span className={`h-2 w-2 rounded-full ${estado.dot}`} />
                                            {estado.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                        Documento
                                    </p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                                        <IdentificationIcon className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="truncate">
                                            {cliente.nroDocumento || "Sin documento"}
                                        </span>
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                        Telefono
                                    </p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                                        <PhoneIcon className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="truncate">
                                            {cliente.telefono || "Sin telefono"}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Correo
                                </p>
                                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                                    <EnvelopeIcon className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="truncate">
                                        {cliente.correo || "Sin correo registrado"}
                                    </span>
                                </p>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onEditCliente(cliente)
                                    }}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                                    aria-label={`Editar a ${cliente.nombres}`}
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                    Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onDeleteCliente(cliente)
                                    }}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                                    aria-label={`Eliminar a ${cliente.nombres}`}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="hidden sm:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Cliente
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground sm:table-cell">
                                    Tipo Doc.
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground md:table-cell">
                                    Nro. Documento
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">
                                    Telefono
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map((cliente) => {
                                const color = getAvatarColor(cliente.idCliente)
                                const initials = getInitials(cliente.nombres)
                                const isSelected = selectedClienteId === cliente.idCliente
                                const tipoDoc =
                                    tipoDocumentoBadge[cliente.tipoDocumento] ?? {
                                        label: cliente.tipoDocumento,
                                        cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                                    }
                                const estado =
                                    estadoBadge[cliente.estado] ?? {
                                        label: cliente.estado,
                                        dot: "bg-gray-400",
                                        cls: "text-gray-600",
                                    }

                                return (
                                    <tr
                                        key={cliente.idCliente}
                                        onClick={() => onSelectCliente(cliente)}
                                        className={`cursor-pointer border-b transition-colors last:border-0 ${
                                            isSelected
                                                ? "bg-blue-50/70 dark:bg-blue-500/10"
                                                : "hover:bg-muted/30"
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color.bg} ${color.text}`}
                                                >
                                                    {initials}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="block truncate font-semibold">
                                                        {cliente.nombres}
                                                    </span>
                                                    <p className="truncate text-xs text-muted-foreground sm:hidden">
                                                        {cliente.correo}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 sm:table-cell">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tipoDoc.cls}`}
                                            >
                                                {tipoDoc.label}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 py-3 font-semibold text-muted-foreground md:table-cell">
                                            {cliente.nroDocumento}
                                        </td>
                                        <td className="hidden px-4 py-3 font-semibold text-muted-foreground lg:table-cell">
                                            {cliente.telefono}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${estado.cls}`}
                                            >
                                                <span className={`h-2 w-2 rounded-full ${estado.dot}`} />
                                                {estado.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="inline-flex items-center gap-2">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            onEditCliente(cliente)
                                                        }}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                                        aria-label={`Editar a ${cliente.nombres}`}
                                                        title="Editar cliente"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            onDeleteCliente(cliente)
                                                        }}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                                        aria-label={`Eliminar a ${cliente.nombres}`}
                                                        title="Eliminar cliente"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <ChevronRightIcon
                                                    className={`h-4 w-4 shrink-0 transition-colors ${
                                                        isSelected ? "text-blue-600" : "text-muted-foreground/50"
                                                    }`}
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export const ClientesTable = memo(ClientesTableComponent)
