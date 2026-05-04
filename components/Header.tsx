"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  BuildingStorefrontIcon,
  ClockIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
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
import { hasAccess } from "@/lib/auth/permissions"
import { getRoleLabel } from "@/lib/auth/roles"
import { useTurnoCountdown, type TurnoFase } from "@/lib/hooks/useTurnoCountdown"
import { navSections } from "@/components/Sidebar"

interface HeaderProps {
  onMenuToggle: () => void
}

const barColorByFase: Record<TurnoFase, string> = {
  inactivo: "bg-slate-300 dark:bg-slate-600",
  normal: "bg-emerald-500",
  alerta: "bg-amber-500",
  peligro: "bg-rose-500",
  vencido: "bg-rose-600",
}

const textColorByFase: Record<TurnoFase, string> = {
  inactivo: "text-muted-foreground",
  normal: "text-emerald-600 dark:text-emerald-400",
  alerta: "text-amber-600 dark:text-amber-400",
  peligro: "text-rose-600 dark:text-rose-400",
  vencido: "text-rose-600 dark:text-rose-400",
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ventas": "Ventas POS",
  "/ventas/cotizacion": "Cotizaciones",
  "/ventas/cotizacion/historial": "Historial de Cotizaciones",
  "/ventas/historial": "Comprobantes",
  "/ventas/guia-remision": "Guia de Remision Remitente",
  "/ventas/guia-remision/nueva": "Nueva Guia de Remision Remitente",
  "/ventas/guia-remision/catalogos/conductores": "Catalogos GRE Remitente no Vigentes",
  "/ventas/guia-remision/catalogos/transportistas": "Catalogos GRE Remitente no Vigentes",
  "/ventas/guia-remision/catalogos/vehiculos": "Catalogos GRE Remitente no Vigentes",
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
  "/turnos": "Turnos",
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
  if (pathname.startsWith("/ventas/guia-remision")) return "GRE Remitente"
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
  if (pathname.startsWith("/sucursales") || pathname.startsWith("/turnos")) return "Administracion"
  return "Principal"
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const turnoCountdown = useTurnoCountdown(user?.horaInicioTurno, user?.horaFinTurno)

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [isSearchOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false)
        setSearchQuery("")
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  const modalFilteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!hasAccess(user?.rol, item.href)) return false
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
          item.label.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q) ||
          section.subtitle.toLowerCase().includes(q)
        )
      }),
    }))
    .filter((section) => section.items.length > 0)

  const totalModulos = navSections
    .flatMap((s) => s.items)
    .filter((item) => hasAccess(user?.rol, item.href)).length

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

  const closeSearch = () => {
    setIsSearchOpen(false)
    setSearchQuery("")
  }

  return (
    <>
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
          {/* Trigger buscador — solo large screens */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-600 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-slate-300"
          >
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0" />
            <span className="w-64 text-left text-xs">Buscar modulo...</span>
            <span className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] font-medium text-slate-400 dark:border-white/10 dark:bg-white/5">
              ⌘K
            </span>
          </button>

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
                    {turnoCountdown.fase === "vencido" && (
                      <span className="hidden shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600 sm:inline-flex dark:bg-rose-500/15 dark:text-rose-400">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        Turno acabado
                      </span>
                    )}
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

                  {/* Sucursales asignadas */}
                  {user.sucursalesPermitidas && user.sucursalesPermitidas.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="my-0" />
                      <div className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <BuildingStorefrontIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                            Sucursales
                          </p>
                        </div>
                        <div className="space-y-1">
                          {user.sucursalesPermitidas.map((s) => (
                            <div key={s.idSucursal} className="flex items-center gap-2">
                              <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.idSucursal === user.idSucursal ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                              <span className={`text-xs ${s.idSucursal === user.idSucursal ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-muted-foreground'}`}>
                                {s.nombreSucursal}
                              </span>
                              {s.idSucursal === user.idSucursal && (
                                <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">Principal</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Turno y tiempo restante */}
                  {user.nombreTurno && (
                    <>
                      <DropdownMenuSeparator className="my-0" />
                      <div className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                            Turno
                          </p>
                        </div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          {user.nombreTurno} ({user.horaInicioTurno} - {user.horaFinTurno})
                        </p>
                        {turnoCountdown.activo && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-muted-foreground">{turnoCountdown.mensaje}</span>
                              <span className={`text-[10px] font-semibold ${textColorByFase[turnoCountdown.fase]}`}>{turnoCountdown.porcentajeTranscurrido}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-1000 ${barColorByFase[turnoCountdown.fase]}`}
                                style={{ width: `${turnoCountdown.porcentajeTranscurrido}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {!turnoCountdown.activo && turnoCountdown.fase !== "vencido" && (
                          <p className="mt-1 text-[10px] text-muted-foreground">{turnoCountdown.mensaje}</p>
                        )}
                        {turnoCountdown.fase === "vencido" && (
                          <div className="mt-2 flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1.5 dark:bg-rose-500/10">
                            <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 text-rose-500 dark:text-rose-400" />
                            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">Turno acabado</span>
                          </div>
                        )}
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

      {/* Modal buscador */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeSearch}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-700/60">
              <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar modulo o pagina..."
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={closeSearch}
                className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                ESC
              </button>
            </div>

            {/* Resultados */}
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {modalFilteredSections.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  Sin resultados para &quot;{searchQuery}&quot;
                </p>
              ) : (
                modalFilteredSections.map((section) => (
                  <div key={section.subtitle} className="mb-1">
                    <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {section.subtitle}
                    </p>
                    {section.items.map((item) => {
                      const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
                      const Icon = active ? item.iconActive : item.icon
                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => {
                            closeSearch()
                            router.push(item.href)
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            active ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${active ? "text-blue-500 dark:text-blue-400" : "text-slate-400"}`} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {active && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                              Activo
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400 dark:border-slate-700/60 dark:text-slate-500">
              {totalModulos} modulos disponibles · Ctrl+K para abrir/cerrar
            </div>
          </div>
        </div>
      )}
    </>
  )
}
