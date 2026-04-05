import {
  ShieldCheck,
  ShoppingCart,
  Package,
  PackageCheck,
  Check,
  X,
  MousePointerClick,
} from "lucide-react"

import type { UsuarioRol } from "@/lib/types/usuario"

const ROLE_ICON: Record<string, React.ElementType> = {
  ADMINISTRADOR: ShieldCheck,
  VENTAS: ShoppingCart,
  ALMACEN: Package,
  VENTAS_ALMACEN: PackageCheck,
}

const ROLE_DESCRIPTION: Record<string, string> = {
  ADMINISTRADOR: "Acceso total al sistema. Gestiona usuarios, sucursales, empresa y todos los modulos sin restricciones.",
  VENTAS: "Enfocado en el punto de venta. Accede a ventas, clientes y comprobantes electronicos.",
  ALMACEN: "Enfocado en inventario. Gestiona productos, stock y reportes de inventario.",
  VENTAS_ALMACEN: "Rol combinado. Accede tanto a ventas y clientes como a productos e inventario.",
}

const PERMISSION_MODULES = [
  "Dashboard",
  "Ventas",
  "Clientes",
  "Productos",
  "Stock",
  "Comprobantes",
  "Reportes productos",
  "Sucursales",
  "Usuarios",
  "Empresa",
] as const

const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  ADMINISTRADOR: new Set(PERMISSION_MODULES),
  VENTAS: new Set(["Dashboard", "Ventas", "Clientes", "Comprobantes"]),
  ALMACEN: new Set(["Dashboard", "Productos", "Stock", "Reportes productos"]),
  VENTAS_ALMACEN: new Set([
    "Dashboard",
    "Ventas",
    "Clientes",
    "Productos",
    "Stock",
    "Comprobantes",
    "Reportes productos",
  ]),
}

const ROLE_COLOR: Record<string, { bg: string; text: string; icon: string; dot: string }> = {
  ADMINISTRADOR: {
    bg: "bg-violet-50 dark:bg-violet-500/10",
    text: "text-violet-700 dark:text-violet-400",
    icon: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  VENTAS: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    icon: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  ALMACEN: {
    bg: "bg-sky-50 dark:bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    icon: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  VENTAS_ALMACEN: {
    bg: "bg-teal-50 dark:bg-teal-500/10",
    text: "text-teal-700 dark:text-teal-400",
    icon: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
  },
}

const DEFAULT_ROLE_COLOR = ROLE_COLOR.VENTAS

interface RoleMasterDetailProps {
  availableRoles: { value: string; label: string }[]
  selectedRol: string
  onSelect: (rol: string) => void
}

function RoleDetailEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <MousePointerClick className="size-8 text-muted-foreground/30" />
      <p className="text-xs text-muted-foreground">
        Selecciona un rol para ver sus permisos
      </p>
    </div>
  )
}

function RoleDetailContent({
  rol,
  label,
  colors,
}: {
  rol: UsuarioRol
  label: string
  colors: (typeof ROLE_COLOR)[string]
}) {
  const permissions = ROLE_PERMISSIONS[rol]
  const Icon = ROLE_ICON[rol] ?? ShieldCheck

  const allowed = permissions
    ? PERMISSION_MODULES.filter((m) => permissions.has(m))
    : []
  const restricted = permissions
    ? PERMISSION_MODULES.filter((m) => !permissions.has(m))
    : [...PERMISSION_MODULES]

  return (
    <div className="flex-1 p-4">
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}
        >
          <Icon className={`size-5 ${colors.icon}`} />
        </div>
        <div className="min-w-0">
          <h4 className={`text-sm font-bold ${colors.text}`}>{label}</h4>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {ROLE_DESCRIPTION[rol] ?? ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-2.5">
          <div className="mb-2 flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Permitidos
            </span>
            <span className="ml-auto text-[10px] font-medium text-emerald-600/70">
              {allowed.length}
            </span>
          </div>
          <div className="space-y-1">
            {allowed.map((mod) => (
              <div key={mod} className="flex items-center gap-1.5">
                <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="size-2.5 text-emerald-600" />
                </div>
                <span className="text-[11px] font-medium text-emerald-900 dark:text-emerald-300">
                  {mod}
                </span>
              </div>
            ))}
            {allowed.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic">Ninguno</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-muted/20 p-2.5 opacity-75">
          <div className="mb-2 flex items-center gap-1.5">
            <X className="size-3.5 text-muted-foreground/60" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Restringidos
            </span>
            <span className="ml-auto text-[10px] font-medium text-muted-foreground/50">
              {restricted.length}
            </span>
          </div>
          <div className="space-y-1">
            {restricted.map((mod) => (
              <div key={mod} className="flex items-center gap-1.5">
                <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted-foreground/10">
                  <X className="size-2.5 text-muted-foreground/40" />
                </div>
                <span className="text-[11px] text-muted-foreground/50 line-through">
                  {mod}
                </span>
              </div>
            ))}
            {restricted.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic">
                Sin restricciones
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function RoleMasterDetail({
  availableRoles,
  selectedRol,
  onSelect,
}: RoleMasterDetailProps) {
  const hasSelection = selectedRol !== ""
  const colors = hasSelection
    ? (ROLE_COLOR[selectedRol] ?? DEFAULT_ROLE_COLOR)
    : null
  const selectedLabel = hasSelection
    ? (availableRoles.find((r) => r.value === selectedRol)?.label ?? selectedRol)
    : ""

  return (
    <div className="flex overflow-hidden rounded-xl border">
      <div className="flex w-[160px] shrink-0 flex-col border-r bg-muted/20">
        {availableRoles.map((option) => {
          const isActive = hasSelection && selectedRol === option.value
          const roleColors = ROLE_COLOR[option.value] ?? DEFAULT_ROLE_COLOR
          const RoleIcon = ROLE_ICON[option.value] ?? ShieldCheck
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`relative flex items-center gap-2.5 px-3 py-3 text-left transition-colors ${
                isActive
                  ? `${roleColors.bg} ${roleColors.text}`
                  : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              {isActive && (
                <span
                  className={`absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full ${roleColors.dot}`}
                />
              )}
              <RoleIcon
                className={`size-4 shrink-0 ${
                  isActive ? roleColors.icon : "text-muted-foreground/60"
                }`}
              />
              <span className="text-xs font-semibold truncate">
                {option.label}
              </span>
            </button>
          )
        })}
      </div>

      {hasSelection && colors ? (
        <RoleDetailContent
          rol={selectedRol as UsuarioRol}
          label={selectedLabel}
          colors={colors}
        />
      ) : (
        <RoleDetailEmpty />
      )}
    </div>
  )
}
