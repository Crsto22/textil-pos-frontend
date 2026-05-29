import {
  normalizeSupportedRole,
  type SupportedAuthRole,
} from "@/lib/auth/roles"

export type AppNotificationType = "update" | "bugfix" | "info"
export type AppNotificationSeverity = "info" | "success" | "warning"
export type AppNotificationRole = SupportedAuthRole | "ALL"

export interface AppNotification {
  id: string
  title: string
  description: string
  type: AppNotificationType
  date: string
  roles: AppNotificationRole[]
  severity: AppNotificationSeverity
  href?: string
}

export const APP_NOTIFICATIONS: AppNotification[] = [
  {
    id: "admin-turnos-horarios-2026-05-29",
    title: "Turnos con horarios especificos",
    description:
      "Se agrego la gestion de turnos: ahora puedes crear turnos con horas especificas y horarios personalizados.",
    type: "update",
    date: "2026-05-29",
    roles: ["ADMINISTRADOR", "SISTEMA"],
    severity: "success",
    href: "/turnos",
  },
  {
    id: "sunat-comprobantes-2026-05-29",
    title: "Datos SUNAT actualizados",
    description:
      "Se actualizaron los datos de SUNAT. Ya puedes enviar comprobantes desde el sistema.",
    type: "update",
    date: "2026-05-29",
    roles: ["ALL"],
    severity: "info",
  },
  {
    id: "bugfix-sistema-2026-05-29",
    title: "Correccion de detalles del sistema",
    description:
      "Se corrigieron detalles y bugs para mejorar la estabilidad general de la app.",
    type: "bugfix",
    date: "2026-05-29",
    roles: ["ALL"],
    severity: "warning",
  },
]

export function getAppNotificationsForRole(
  role: string | null | undefined
): AppNotification[] {
  const normalizedRole = normalizeSupportedRole(role)

  if (!normalizedRole) return []

  return APP_NOTIFICATIONS.filter(
    (notification) =>
      notification.roles.includes("ALL") ||
      notification.roles.includes(normalizedRole)
  )
}
