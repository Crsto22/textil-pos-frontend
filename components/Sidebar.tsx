"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    UserCog,
    Building2,
    Settings,
    UserCircle,
    CreditCard,
    LogOut,
    ChevronLeft,
    X,
} from "lucide-react"

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Ventas", href: "/ventas", icon: ShoppingCart },
    { label: "Productos", href: "/productos", icon: Package },
    { label: "Clientes", href: "/clientes", icon: Users },
    { label: "Usuarios", href: "/usuarios", icon: UserCog },
    { label: "Sucursales", href: "/sucursales", icon: Building2 },
]

const configItems = [
    { label: "Empresa", href: "/configuracion/empresa", icon: Settings },
    { label: "Mi cuenta", href: "/configuracion/cuenta", icon: UserCircle },
    { label: "Métodos de pago", href: "/configuracion/metodos-pago", icon: CreditCard },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()
    const [collapsed, setCollapsed] = useState(false)

    const handleLogout = async () => {
        await logout()
        router.replace("/")
    }

    const handleNav = (href: string) => {
        router.push(href)
        onClose()
    }

    const isActive = (href: string) => pathname === href

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col
          bg-[#3266E4] text-white
          transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-[72px]" : "lg:w-[260px]"}
          ${isOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full lg:translate-x-0"}
        `}
            >
                {/* Top — Brand */}
                <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-white/10">
                    {!collapsed && (
                        <span className="text-lg font-bold tracking-tight truncate" style={{ fontFamily: "var(--font-sora-semibold)" }}>
                            POS Textil
                        </span>
                    )}
                    {/* Collapse toggle (desktop) */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/10 transition-colors"
                        title={collapsed ? "Expandir" : "Colapsar"}
                    >
                        <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                    </button>
                    {/* Close button (mobile) */}
                    <button
                        onClick={onClose}
                        className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Center — Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 sidebar-scroll">
                    {/* Main nav */}
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <button
                                key={item.href}
                                onClick={() => handleNav(item.href)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${active
                                        ? "bg-white/20 text-white"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                    }
                  ${collapsed ? "justify-center" : ""}
                `}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                            </button>
                        )
                    })}

                    {/* Divider */}
                    <div className="my-3 border-t border-white/10" />

                    {/* Config */}
                    {!collapsed && (
                        <p className="px-3 mb-1 text-[11px] uppercase tracking-wider text-white/50">
                            Configuración
                        </p>
                    )}
                    {configItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <button
                                key={item.href}
                                onClick={() => handleNav(item.href)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${active
                                        ? "bg-white/20 text-white"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                    }
                  ${collapsed ? "justify-center" : ""}
                `}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                            </button>
                        )
                    })}
                </nav>

                {/* Bottom — User + Logout */}
                <div className="shrink-0 border-t border-white/10 px-3 py-3 space-y-2">
                    {!collapsed && user && (
                        <div className="px-3 py-2">
                            <p className="text-sm font-medium truncate">{user.nombre} {user.apellido}</p>
                            <p className="text-xs text-white/60 truncate">{user.rol}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-white/80 hover:bg-white/10 hover:text-white transition-colors
              ${collapsed ? "justify-center" : ""}
            `}
                        title="Cerrar sesión"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>Cerrar sesión</span>}
                    </button>
                </div>
            </aside>
        </>
    )
}
