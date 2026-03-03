"use client"

import { ArrowRightStartOnRectangleIcon, Bars3Icon, UserCircleIcon } from "@heroicons/react/24/outline"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth/auth-context"

interface HeaderProps {
    onMenuToggle: () => void
}

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/ventas": "Ventas",
    "/ventas/historial": "Historial de Ventas",
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
        (/^\/productos\/\d+\/editar$/.test(pathname) ? "Editar Producto" : "Panel")

    const sectionLabel = getSectionLabel(pathname)

    const handleLogout = async () => {
        await logout()
        router.replace("/")
    }

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/75 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[oklch(0.14_0_0/.88)]">
            <div className="flex h-[70px] items-center justify-between gap-3 px-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={onMenuToggle}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_18px_-16px_rgba(15,23,42,0.8)] dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 lg:hidden"
                        aria-label="Abrir menu"
                    >
                        <Bars3Icon className="h-5 w-5" />
                    </button>

                    <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            {sectionLabel}
                        </p>
                        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                            {title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {user && (
                        <div className="hidden items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 py-1.5 shadow-[0_12px_22px_-20px_rgba(15,23,42,0.9)] md:flex dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 via-indigo-50 to-cyan-100 text-blue-700 shadow-inner dark:from-blue-400/35 dark:via-indigo-400/20 dark:to-cyan-400/20 dark:text-blue-100">
                                <UserCircleIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 max-w-[210px] leading-tight">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                    {user.nombre} {user.apellido}
                                </p>
                                <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-200">
                                    {user.rol}
                                </span>
                            </div>
                        </div>
                    )}

                    <ThemeToggle />

                    <button
                        onClick={handleLogout}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_10px_20px_-16px_rgba(15,23,42,0.8)] dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                        title="Cerrar sesion"
                        aria-label="Cerrar sesion"
                    >
                        <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
                        <span className="hidden md:inline">Cerrar sesion</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
