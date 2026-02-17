import { memo } from "react"
import {
    ChevronRightIcon,
    PencilSquareIcon,
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
    return (
        <div className="overflow-hidden rounded-xl border bg-card">
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
                                Teléfono
                            </th>
                            <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground xl:table-cell">
                                Sucursal
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
                        {loading ? (
                            <ClientesTableSkeleton />
                        ) : clientes.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                    No se encontraron clientes
                                </td>
                            </tr>
                        ) : (
                            clientes.map((cliente) => {
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
                                        className={`cursor-pointer border-b transition-colors last:border-0 ${isSelected
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
                                        <td className="hidden px-4 py-3 font-semibold text-muted-foreground xl:table-cell">
                                            {cliente.nombreSucursal || "Sin sucursal"}
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
                                                    className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? "text-blue-600" : "text-muted-foreground/50"
                                                        }`}
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export const ClientesTable = memo(ClientesTableComponent)
