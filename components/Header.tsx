"use client"

import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth/auth-context"
import { getRoleLabel } from "@/lib/auth/roles"

interface HeaderProps {
  onMenuToggle: () => void
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ventas": "Ventas POS",
  "/ventas/cotizacion": "Cotizaciones",
  "/ventas/cotizacion/historial": "Historial de Cotizaciones",
  "/ventas/historial": "Comprobantes",
  "/ventas/nota-credito": "Nota de Crédito",
  "/ventas/pagos": "Historial de Pagos",
  "/reportes/ventas": "Reporte de Ventas",
  "/productos": "Productos",
  "/productos/nuevo": "Nuevo Producto",
  "/productos/carga-masiva": "Carga Masiva de Productos",
  "/reportes/productos": "Reporte de Productos",
  "/reportes/clientes": "Reporte de Clientes",
  "/reportes/usuarios": "Reporte de Usuarios",
  "/clientes": "Clientes",
  "/usuarios": "Usuarios",
  "/sucursales": "Sucursales",
  "/productos/tallas": "Tallas",
  "/productos/colores": "Colores",
  "/configuracion/empresa": "Configuracion de Empresa",
  "/configuracion/cuenta": "Configuracion de Cuenta",
  "/configuracion/metodos-pago": "Metodos de Pago",
  "/configuracion/comprobantes": "Series",
}

const getSectionLabel = (pathname: string) => {
  if (pathname.startsWith("/reportes")) return "Reportes"
  if (pathname.startsWith("/ventas/historial")) return "Facturacion"
  if (
    pathname.startsWith("/ventas/cotizacion/historial") ||
    pathname.startsWith("/ventas/pagos")
  ) return "Historial"
  if (
    pathname.startsWith("/ventas/nota-credito") ||
    pathname.startsWith("/configuracion/comprobantes")
  ) return "Facturacion"
  if (pathname.startsWith("/ventas") || pathname.startsWith("/clientes")) return "Operaciones"
  if (pathname.startsWith("/productos")) return "Catalogo"
  if (pathname.startsWith("/configuracion")) return "Configuracion"
  if (pathname.startsWith("/usuarios")) return "Usuarios"
  if (pathname.startsWith("/sucursales")) return "Administracion"
  return "Principal"
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const title =
    pageTitles[pathname] ??
    (/^\/ventas\/historial\/\d+$/.test(pathname)
      ? "Detalle de Comprobante"
      : /^\/productos\/\d+\/editar$/.test(pathname)
        ? "Editar Producto"
        : /^\/ventas\/cotizacion\/\d+\/editar$/.test(pathname)
          ? "Editar Cotizacion"
          : "Panel")

  const sectionLabel = getSectionLabel(pathname)

  const handleLogout = async () => {
    await logout()
    router.replace("/")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[oklch(0.13_0_0/.95)]">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">

        {/* Izquierda: toggle + breadcrumb */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
            aria-label="Abrir menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-widest text-blue-600 sm:inline-flex dark:bg-blue-500/10 dark:text-blue-400">
              {sectionLabel}
            </span>
            <span className="hidden h-4 w-px bg-slate-200 sm:block dark:bg-white/10" />
            <h1 className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
              {title}
            </h1>
          </div>
        </div>

        {/* Derecha: acciones */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle
            variant="ghost"
            size="icon-sm"
            className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          />

          {user && (
            <>
              <span className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block dark:bg-white/10" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="group flex items-center gap-2.5 rounded-xl px-1.5 py-1 outline-none ring-blue-500/40 transition-colors hover:bg-slate-100 focus-visible:ring-2 dark:hover:bg-white/10"
                    aria-label="Menu de usuario"
                  >
                    <div className="relative shrink-0">
                      <UserAvatar
                        nombre={user.nombre}
                        apellido={user.apellido}
                        fotoPerfilUrl={user.fotoPerfilUrl}
                        className="h-8 w-8 ring-2 ring-blue-500/25 transition-all group-hover:ring-blue-500/50 dark:ring-blue-400/25 dark:group-hover:ring-blue-400/50"
                        fallbackClassName="bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                        textClassName="text-[11px] font-bold"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[oklch(0.13_0_0)]" />
                    </div>
                    <div className="hidden min-w-0 max-w-[140px] text-left leading-none sm:block">
                      <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                        {user.nombre} {user.apellido}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-blue-600 dark:text-blue-400">
                        {getRoleLabel(user.rol)}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64 overflow-hidden p-0"
                >
                  {/* Cabecera con info del usuario */}
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 bg-gradient-to-br from-slate-50 to-blue-50/40 p-4 dark:from-white/[0.03] dark:to-blue-500/5">
                      <div className="relative shrink-0">
                        <UserAvatar
                          nombre={user.nombre}
                          apellido={user.apellido}
                          fotoPerfilUrl={user.fotoPerfilUrl}
                          className="h-11 w-11 ring-2 ring-blue-500/20 dark:ring-blue-400/20"
                          fallbackClassName="bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                          textClassName="text-xs font-bold"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[hsl(var(--popover))]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-slate-900 dark:text-white">
                          {user.nombre} {user.apellido}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.correo}
                        </p>
                        <span className="mt-1.5 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold leading-none text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          {getRoleLabel(user.rol)}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  {/* Sucursal asignada (solo si tiene) */}
                  {user.nombreSucursal && (
                    <>
                      <DropdownMenuSeparator className="my-0" />
                      <div className="flex items-center gap-2 px-4 py-2.5">
                        <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                            Sucursal asignada
                          </p>
                          <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                            {user.nombreSucursal}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <DropdownMenuSeparator className="my-0" />

                  <div className="p-1">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/configuracion/cuenta"
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm"
                      >
                        <Cog6ToothIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>Configuracion de cuenta</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="my-0" />

                  <div className="p-1">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-500/10 dark:focus:text-rose-300"
                    >
                      <ArrowRightStartOnRectangleIcon className="h-4 w-4 shrink-0" />
                      <span>Cerrar sesion</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
