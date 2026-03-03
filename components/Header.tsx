"use client"

import { usePathname, useRouter } from "next/navigation"
import { ArrowRightStartOnRectangleIcon, Bars3Icon, UserCircleIcon } from "@heroicons/react/24/outline"
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
    "/configuracion/empresa": "Configuración de Empresa",
    "/configuracion/cuenta": "Configuración de Cuenta",
    "/configuracion/metodos-pago": "Métodos de Pago",
}

export function Header({ onMenuToggle }: HeaderProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()
    const title =
        pageTitles[pathname] ??
        (/^\/productos\/\d+\/editar$/.test(pathname) ? "Editar Producto" : "Panel")

    const handleLogout = async () => {
        await logout()
        router.replace("/")
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white/90 px-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:bg-[oklch(0.15_0_0/.88)] dark:shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    aria-label="Abrir menú"
                >
                    <Bars3Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {title}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                {user && (
                    <div className="hidden sm:flex items-center gap-3 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-100 px-3 py-1.5 shadow-[0_8px_25px_-18px_rgba(15,23,42,0.55)] dark:from-white/12 dark:via-white/8 dark:to-white/[0.03] dark:shadow-none">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 shadow-inner dark:from-white/20 dark:to-white/10 dark:text-gray-100">
                            <UserCircleIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 max-w-[190px] leading-tight">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {user.nombre} {user.apellido}
                            </p>
                            <span className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-gray-300/90">
                                {user.rol}
                            </span>
                        </div>
                    </div>
                )}
                <ThemeToggle />
                <button
                    onClick={handleLogout}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                    title="Cerrar sesion"
                    aria-label="Cerrar sesion"
                >
                    <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
                    <span className="hidden md:inline">Cerrar sesion</span>
                </button>
            </div>
        </header>
    )
}
