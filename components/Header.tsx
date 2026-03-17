"use client"

import { ArrowRightStartOnRectangleIcon, Bars3Icon } from "@heroicons/react/24/outline"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth/auth-context"

interface HeaderProps {
    onMenuToggle: () => void
}

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/ventas": "Ventas",
    "/ventas/cotizacion": "Cotizacion",
    "/ventas/cotizacion/historial": "Historial de Cotizacion",
    "/ventas/historial": "Historial de Ventas",
    "/ventas/pagos": "Pagos",
    "/productos": "Productos",
    "/productos/nuevo": "Nuevo Producto",
    "/productos/carga-masiva": "Carga Masiva de Productos",
    "/clientes": "Clientes",
    "/usuarios": "Usuarios",
    "/sucursales": "Sucursales",
    "/productos/tallas": "Tallas",
    "/productos/colores": "Colores",
    "/configuracion/empresa": "Configuracion de Empresa",
    "/configuracion/cuenta": "Configuracion de Cuenta",
    "/configuracion/metodos-pago": "Metodos de Pago",
}

const getSectionLabel = (pathname: string) => {
    if (pathname.startsWith("/ventas")) return "Ventas"
    if (pathname.startsWith("/productos")) return "Catalogo"
    if (pathname.startsWith("/configuracion")) return "Configuracion"
    if (pathname.startsWith("/clientes")) return "Clientes"
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
        (/^\/productos\/\d+\/editar$/.test(pathname)
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
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[oklch(0.13_0_0/.80)]">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
                {/* Left: menu + title */}
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={onMenuToggle}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 lg:hidden"
                        aria-label="Abrir menu"
                    >
                        <Bars3Icon className="h-5 w-5" />
                    </button>

                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="hidden shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-widest text-blue-600 sm:inline-flex dark:bg-blue-500/10 dark:text-blue-400">
                            {sectionLabel}
                        </span>
                        <span className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-white/15" />
                        <h1 className="truncate text-[15px] font-semibold text-slate-900 sm:text-base dark:text-white">
                            {title}
                        </h1>
                    </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <ThemeToggle
                        variant="ghost"
                        size="icon-sm"
                        className="h-9 w-9 rounded-lg text-slate-700 hover:bg-amber-50 hover:text-amber-600 dark:text-slate-200 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                    />

                    <span className="hidden h-5 w-px bg-slate-300 sm:block dark:bg-white/15" />

                    {user && (
                        <div className="hidden items-center gap-2.5 pl-1 sm:flex">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-blue-600 dark:ring-blue-400">
                                <Image
                                    src="/img/avatar/avatar1.png"
                                    alt={`Avatar de ${user.nombre} ${user.apellido}`}
                                    fill
                                    sizes="32px"
                                    className="object-cover"
                                />
                                <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full border-[1.5px] border-white bg-emerald-500 dark:border-[oklch(0.13_0_0)]" />
                            </div>
                            <div className="min-w-0 max-w-[180px] leading-none">
                                <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                                    {user.nombre} {user.apellido}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] font-medium text-blue-600 dark:text-blue-400">
                                    {user.rol}
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                        title="Cerrar sesion"
                        aria-label="Cerrar sesion"
                    >
                        <ArrowRightStartOnRectangleIcon className="h-[18px] w-[18px]" />
                        <span className="hidden sm:inline">Salir</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
