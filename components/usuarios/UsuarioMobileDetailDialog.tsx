import { memo } from "react"
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  IdentificationIcon,
  PencilSquareIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import type { Usuario } from "@/lib/types/usuario"
import {
  estadoBadge,
  formatFecha,
  getAvatarColor,
  getInitials,
  rolBadge,
} from "@/components/usuarios/usuarios.utils"

interface UsuarioMobileDetailDialogProps {
  open: boolean
  selectedUser: Usuario | null
  onOpenChange: (open: boolean) => void
  onEditUser: (usuario: Usuario) => void
}

function UsuarioMobileDetailDialogComponent({
  open,
  selectedUser,
  onOpenChange,
  onEditUser,
}: UsuarioMobileDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm xl:hidden">
        {selectedUser &&
          (() => {
            const color = getAvatarColor(selectedUser.idUsuario)
            const initials = getInitials(selectedUser.nombre, selectedUser.apellido)
            const rol =
              rolBadge[selectedUser.rol] ?? {
                label: selectedUser.rol,
                cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
              }
            const estado =
              estadoBadge[selectedUser.estado] ?? {
                label: selectedUser.estado,
                dot: "bg-gray-400",
                cls: "text-gray-600",
              }

            return (
              <>
                <div className="flex flex-col items-center pb-4 pt-2">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${color.bg} ${color.text}`}
                  >
                    {initials}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">
                    {selectedUser.nombre} {selectedUser.apellido}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${rol.cls}`}
                    >
                      {rol.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${estado.cls} ${
                        estado.dot === "bg-emerald-500"
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${estado.dot}`} />
                      {estado.label}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-5">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Información del Usuario
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <IdentificationIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          DNI
                        </p>
                        <p className="text-sm font-medium">{selectedUser.dni}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Teléfono
                        </p>
                        <p className="text-sm font-medium">{selectedUser.telefono}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <EnvelopeIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Correo
                        </p>
                        <p className="break-all text-sm font-medium">
                          {selectedUser.correo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <BuildingStorefrontIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Sucursal
                        </p>
                        <p className="text-sm font-medium">
                          {selectedUser.nombreSucursal}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Fecha de Registro
                        </p>
                        <p className="text-sm font-medium">
                          {formatFecha(selectedUser.fechaCreacion)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => onEditUser(selectedUser)}
                  >
                    <PencilSquareIcon className="mr-2 h-4 w-4" />
                    Editar Usuario
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
      </DialogContent>
    </Dialog>
  )
}

export const UsuarioMobileDetailDialog = memo(UsuarioMobileDetailDialogComponent)
