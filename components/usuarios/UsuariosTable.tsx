import { memo } from "react"
import { TrashIcon } from "@heroicons/react/24/outline"

import { UsuariosTableSkeleton } from "@/components/usuarios/UsuariosTableSkeleton"
import type { Usuario } from "@/lib/types/usuario"
import {
  estadoBadge,
  getAvatarColor,
  getInitials,
  rolBadge,
} from "@/components/usuarios/usuarios.utils"

interface UsuariosTableProps {
  users: Usuario[]
  loading: boolean
  isSearchMode: boolean
  selectedUserId: number | null
  onSelectUser: (usuario: Usuario) => void
  onDeleteUser: (usuario: Usuario) => void
}

function UsuariosTableComponent({
  users,
  loading,
  isSearchMode,
  selectedUserId,
  onSelectUser,
  onDeleteUser,
}: UsuariosTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
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
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rol
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estado
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <UsuariosTableSkeleton />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  {isSearchMode
                    ? "No se encontraron resultados"
                    : "No se encontraron usuarios"}
                </td>
              </tr>
            ) : (
              users.map((usuario) => {
                const color = getAvatarColor(usuario.idUsuario)
                const initials = getInitials(usuario.nombre, usuario.apellido)
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
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color.bg} ${color.text}`}
                        >
                          {initials}
                        </div>
                        <div>
                          <span className="font-semibold">
                            {usuario.nombre} {usuario.apellido}
                          </span>
                          <p className="text-xs text-muted-foreground sm:hidden">
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
                      {usuario.nombreSucursal}
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

export const UsuariosTable = memo(UsuariosTableComponent)
