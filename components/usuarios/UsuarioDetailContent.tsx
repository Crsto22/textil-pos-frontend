import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  IdentificationIcon,
  KeyIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/user-avatar"
import type { Usuario } from "@/lib/types/usuario"
import {
  estadoBadge,
  formatFecha,
  getAvatarColor,
  getSucursalDisplay,
  getSucursalesAdicionalesDisplay,
  getTurnoDisplay,
  rolBadge,
} from "@/components/usuarios/usuarios.utils"

interface UsuarioDetailContentProps {
  selectedUser: Usuario
  onResetPassword: (usuario: Usuario) => void
  compact?: boolean
}

export function UsuarioDetailContent({
  selectedUser,
  onResetPassword,
  compact = false,
}: UsuarioDetailContentProps) {
  const color = getAvatarColor(selectedUser.idUsuario)
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
  const sucursalDisplay = getSucursalDisplay(
    selectedUser.rol,
    selectedUser.nombreSucursal
  )
  const sucursalesAdicionales = getSucursalesAdicionalesDisplay(
    selectedUser.sucursalesPermitidas,
    selectedUser.idSucursal
  )
  const turnoDisplay = getTurnoDisplay(
    selectedUser.nombreTurno,
    selectedUser.horaInicioTurno,
    selectedUser.horaFinTurno,
    selectedUser.diasTurno
  )

  const headerClassName = compact
    ? "flex flex-col items-center pb-4 pt-2"
    : "flex flex-col items-center px-6 pb-6"

  const sectionClassName = compact ? "border-t pt-5" : "border-t px-6 py-5"

  const actionClassName = compact ? "border-t pt-4" : "border-t px-6 py-5"

  return (
    <>
      <div className={headerClassName}>
        <UserAvatar
          nombre={selectedUser.nombre}
          apellido={selectedUser.apellido}
          fotoPerfilUrl={selectedUser.fotoPerfilUrl}
          className="h-16 w-16"
          fallbackClassName={`${color.bg} ${color.text}`}
          textClassName="text-xl font-bold"
        />
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

      <div className={sectionClassName}>
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
              <p className="text-sm font-medium">{sucursalDisplay}</p>
              {sucursalesAdicionales.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {sucursalesAdicionales.map((nombre) => (
                    <Badge key={nombre} variant="secondary" className="text-[10px]">
                      {nombre}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Turno
              </p>
              <p className="text-sm font-medium">{turnoDisplay}</p>
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

      <div className={actionClassName}>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onResetPassword(selectedUser)}
        >
          <KeyIcon className="h-4 w-4" />
          Cambiar contraseña
        </Button>
      </div>
    </>
  )
}
