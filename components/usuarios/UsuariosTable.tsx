import { memo } from "react"
import {
    BuildingStorefrontIcon,
    ChevronRightIcon,
    EnvelopeIcon,
    IdentificationIcon,
    PencilSquareIcon,
    TrashIcon,
} from "@heroicons/react/24/outline"

import { UsuariosTableSkeleton } from "@/components/usuarios/UsuariosTableSkeleton"
import { UserAvatar } from "@/components/ui/user-avatar"
import type { Usuario } from "@/lib/types/usuario"
import {
    estadoBadge,
    getAvatarColor,
    getSucursalDisplay,
    getSucursalesAdicionalesDisplay,
    getTurnoDisplay,
    rolBadge,
} from "@/components/usuarios/usuarios.utils"

interface UsuariosTableProps {
    users: Usuario[]
    loading: boolean
    isSearchMode: boolean
    selectedUserId: number | null
    onSelectUser: (usuario: Usuario) => void
    onEditUser: (usuario: Usuario) => void
    onDeleteUser: (usuario: Usuario) => void
}

function UsuariosTableComponent({
    users,
    loading,
    isSearchMode,
    selectedUserId,
    onSelectUser,
    onEditUser,
    onDeleteUser,
}: UsuariosTableProps) {
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
                            <div className="mt-2 h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
                        </div>
                    ))}
                </div>

                <div className="hidden sm:block">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <tbody>
                                <UsuariosTableSkeleton />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }

    if (users.length === 0) {
        return (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
                <div className="px-4 py-14 text-center text-sm text-slate-400 dark:text-slate-500">
                    {isSearchMode
                        ? "No se encontraron resultados"
                        : "No se encontraron usuarios"}
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-hidden dark:border-slate-700/60 dark:bg-slate-800/80">
            {/* Mobile cards */}
            <div className="space-y-3 p-3 sm:hidden">
                {users.map((usuario) => {
                    const color = getAvatarColor(usuario.idUsuario)
                    const isSelected = selectedUserId === usuario.idUsuario
                    const rol =
                        rolBadge[usuario.rol] ?? {
                            label: usuario.rol,
                            cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                        }
                    const estado =
                        estadoBadge[usuario.estado] ?? {
                            label: usuario.estado,
                            dot: "bg-gray-400",
                            cls: "text-gray-600",
                        }
                    const sucursalDisplay = getSucursalDisplay(usuario.rol, usuario.nombreSucursal)
                    const sucursalesAdicionales = getSucursalesAdicionalesDisplay(
                        usuario.sucursalesPermitidas,
                        usuario.idSucursal
                    )

                    return (
                        <div
                            key={usuario.idUsuario}
                            onClick={() => onSelectUser(usuario)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    onSelectUser(usuario)
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
                                <UserAvatar
                                    nombre={usuario.nombre}
                                    apellido={usuario.apellido}
                                    fotoPerfilUrl={usuario.fotoPerfilUrl}
                                    className="h-11 w-11 shrink-0"
                                    fallbackClassName={`${color.bg} ${color.text}`}
                                    textClassName="text-sm font-bold"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                {usuario.nombre} {usuario.apellido}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                                {usuario.correo}
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
                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${rol.cls}`}
                                        >
                                            {rol.label}
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
                                        DNI
                                    </p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                                        <IdentificationIcon className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="truncate">
                                            {usuario.dni || "Sin DNI"}
                                        </span>
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                        Sucursal
                                    </p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                                        <BuildingStorefrontIcon className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="truncate">{sucursalDisplay}</span>
                                    </p>
                                    {sucursalesAdicionales.length > 0 && (
                                        <div className="mt-0.5 ml-5">
                                            {sucursalesAdicionales.map((nombre) => (
                                                <span key={nombre} className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                    {nombre}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Correo
                                </p>
                                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                                    <EnvelopeIcon className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="truncate">{usuario.correo}</span>
                                </p>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onEditUser(usuario)
                                    }}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                                    aria-label={`Editar a ${usuario.nombre} ${usuario.apellido}`}
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                    Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onDeleteUser(usuario)
                                    }}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                                    aria-label={`Eliminar a ${usuario.nombre} ${usuario.apellido}`}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Usuario
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground md:table-cell">
                                    DNI
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground sm:table-cell">
                                    Correo
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">
                                    Sucursal
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground xl:table-cell">
                                    Turno
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Rol
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
                            {users.map((usuario) => {
                                const color = getAvatarColor(usuario.idUsuario)
                                const isSelected = selectedUserId === usuario.idUsuario
                                const rol =
                                    rolBadge[usuario.rol] ?? {
                                        label: usuario.rol,
                                        cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                                    }
                                const estado =
                                    estadoBadge[usuario.estado] ?? {
                                        label: usuario.estado,
                                        dot: "bg-gray-400",
                                        cls: "text-gray-600",
                                    }
                                const sucursalDisplay = getSucursalDisplay(usuario.rol, usuario.nombreSucursal)
                                const sucursalesAdicionales = getSucursalesAdicionalesDisplay(
                                    usuario.sucursalesPermitidas,
                                    usuario.idSucursal
                                )
                                const turnoDisplay = getTurnoDisplay(
                                    usuario.nombreTurno,
                                    usuario.horaInicioTurno,
                                    usuario.horaFinTurno,
                                    usuario.diasTurno
                                )

                                return (
                                    <tr
                                        key={usuario.idUsuario}
                                        onClick={() => onSelectUser(usuario)}
                                        className={`cursor-pointer border-b transition-colors last:border-0 ${
                                            isSelected
                                                ? "bg-blue-50/70 dark:bg-blue-500/10"
                                                : "hover:bg-muted/30"
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <UserAvatar
                                                    nombre={usuario.nombre}
                                                    apellido={usuario.apellido}
                                                    fotoPerfilUrl={usuario.fotoPerfilUrl}
                                                    className="h-9 w-9 shrink-0"
                                                    fallbackClassName={`${color.bg} ${color.text}`}
                                                    textClassName="text-xs font-bold"
                                                />
                                                <div className="min-w-0">
                                                    <span className="block truncate font-semibold">
                                                        {usuario.nombre} {usuario.apellido}
                                                    </span>
                                                    <p className="truncate text-xs text-muted-foreground sm:hidden">
                                                        {usuario.correo}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 font-semibold text-muted-foreground md:table-cell">
                                            {usuario.dni}
                                        </td>
                                        <td className="hidden px-4 py-3 font-semibold text-muted-foreground sm:table-cell">
                                            {usuario.correo}
                                        </td>
                                        <td className="hidden px-4 py-3 font-semibold text-muted-foreground lg:table-cell">
                                            <div>
                                                <span>{sucursalDisplay}</span>
                                                {sucursalesAdicionales.length > 0 && (
                                                    <div className="mt-0.5">
                                                        {sucursalesAdicionales.map((nombre) => (
                                                            <span key={nombre} className="block text-xs font-medium text-muted-foreground/70">
                                                                {nombre}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 font-semibold text-muted-foreground xl:table-cell">
                                            {turnoDisplay}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${rol.cls}`}
                                            >
                                                {rol.label}
                                            </span>
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
                                                            onEditUser(usuario)
                                                        }}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                                        aria-label={`Editar a ${usuario.nombre} ${usuario.apellido}`}
                                                        title="Editar usuario"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            onDeleteUser(usuario)
                                                        }}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                                        aria-label={`Eliminar a ${usuario.nombre} ${usuario.apellido}`}
                                                        title="Eliminar usuario"
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

export const UsuariosTable = memo(UsuariosTableComponent)
