"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
    onMenuToggle: () => void
}

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/ventas": "Ventas",
    "/productos": "Productos",
    "/clientes": "Clientes",
    "/usuarios": "Usuarios",
    "/sucursales": "Sucursales",
    "/configuracion/empresa": "Configuración de Empresa",
    "/configuracion/cuenta": "Configuración de Cuenta",
    "/configuracion/metodos-pago": "Métodos de Pago",
}

export function Header({ onMenuToggle }: HeaderProps) {
    const pathname = usePathname()
    const title = pageTitles[pathname] ?? "Panel"

    return (
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-white dark:bg-[oklch(0.15_0_0)] border-b border-gray-200 dark:border-[oklch(0.3_0_0)] shadow-sm">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    aria-label="Abrir menú"
                >
                    <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {title}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
            </div>
        </header>
    )
}
