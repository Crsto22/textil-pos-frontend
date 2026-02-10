"use client"

import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import {
    Squares2X2Icon,
    ChevronLeftIcon,
    CreditCardIcon,
    ArrowRightStartOnRectangleIcon,
    CubeIcon,
    Cog6ToothIcon,
    ShoppingCartIcon,
    UserCircleIcon,
    WrenchScrewdriverIcon,
    UsersIcon,
    XMarkIcon,
    HomeModernIcon,
    BuildingOffice2Icon,
} from "@heroicons/react/24/outline"
import {
    
    Squares2X2Icon as Squares2X2IconSolid,
    CreditCardIcon as CreditCardIconSolid,
    CubeIcon as CubeIconSolid,
    Cog6ToothIcon as Cog6ToothIconSolid,
    ShoppingCartIcon as ShoppingCartIconSolid,
    UserCircleIcon as UserCircleIconSolid,
    WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
    UsersIcon as UsersIconSolid,
    BuildingOffice2Icon as BuildingOffice2IconSolid,
} from "@heroicons/react/24/solid"

interface SidebarProps {
    isOpen: boolean
    collapsed: boolean
    onClose: () => void
    onToggleCollapse: () => void
}

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Squares2X2Icon, iconActive: Squares2X2IconSolid },
    { label: "Ventas", href: "/ventas", icon: ShoppingCartIcon, iconActive: ShoppingCartIconSolid },
    { label: "Productos", href: "/productos", icon: CubeIcon, iconActive: CubeIconSolid },
    { label: "Clientes", href: "/clientes", icon: UsersIcon, iconActive: UsersIconSolid },
    { label: "Usuarios", href: "/usuarios", icon: WrenchScrewdriverIcon, iconActive: WrenchScrewdriverIconSolid },
    { label: "Sucursales", href: "/sucursales", icon: BuildingOffice2Icon, iconActive: BuildingOffice2IconSolid },
]

const configItems = [
    { label: "Empresa", href: "/configuracion/empresa", icon: Cog6ToothIcon, iconActive: Cog6ToothIconSolid },
    { label: "Mi cuenta", href: "/configuracion/cuenta", icon: UserCircleIcon, iconActive: UserCircleIconSolid },
    { label: "Metodos de pago", href: "/configuracion/metodos-pago", icon: CreditCardIcon, iconActive: CreditCardIconSolid },
]

export function Sidebar({ isOpen, collapsed, onClose, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()

    const handleLogout = async () => {
        await logout()
        router.replace("/")
    }

    const handleNav = (href: string) => {
        router.push(href)
        onClose()
    }

    const isActive = (href: string) => pathname === href
    const initials = user
        ? `${user.nombre?.[0] ?? ""}${user.apellido?.[0] ?? ""}`.toUpperCase() || "U"
        : "U"

    const itemClass = (active: boolean) =>
        [
            "group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            collapsed ? "justify-center" : "",
            active
                ? "bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.12)]"
                : "text-slate-400 hover:bg-white/[0.07] hover:text-white",
        ].join(" ")

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[1px] lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col border-r
          border-slate-800/50 bg-slate-900 text-slate-100
          shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-[88px]" : "lg:w-[260px]"}
          ${isOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full lg:translate-x-0"}
        `}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700/50 px-4">
                    {!collapsed && (
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
                                <HomeModernIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold tracking-tight text-white">
                                    POS Textil
                                </p>
                                <span className="truncate text-xs text-slate-400">
                                    Panel Administrativo
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        <button
                            onClick={onToggleCollapse}
                            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:flex"
                            title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                        >
                            <ChevronLeftIcon className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                            aria-label="Cerrar menu"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {navItems.map((item) => {
                        const active = isActive(item.href)
                        const Icon = active ? item.iconActive : item.icon
                        return (
                            <button
                                key={item.href}
                                onClick={() => handleNav(item.href)}
                                className={itemClass(active)}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-blue-600" : ""}`} />
                                {!collapsed && (
                                    <span className="truncate">{item.label}</span>
                                )}
                            </button>
                        )
                    })}

                    <div className="my-3 border-t border-slate-700/50" />

                    {!collapsed && (
                        <p className="px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                            Configuracion
                        </p>
                    )}

                    {configItems.map((item) => {
                        const active = isActive(item.href)
                        const Icon = active ? item.iconActive : item.icon
                        return (
                            <button
                                key={item.href}
                                onClick={() => handleNav(item.href)}
                                className={itemClass(active)}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-blue-600" : ""}`} />
                                {!collapsed && (
                                    <span className="truncate">{item.label}</span>
                                )}
                            </button>
                        )
                    })}
                </nav>

                <div className="shrink-0 space-y-2 border-t border-slate-700/50 px-3 py-3">
                    {!collapsed && user && (
                        <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-white/[0.05] px-3 py-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-semibold text-white">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                    {user.nombre} {user.apellido}
                                </p>
                                <span className="truncate text-xs text-slate-400">{user.rol}</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className={`
              w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
              ${collapsed ? "flex items-center justify-center" : "flex items-center gap-3"}
              text-rose-400 hover:bg-rose-500/10
            `}
                        title="Cerrar sesion"
                    >
                        <ArrowRightStartOnRectangleIcon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>Cerrar sesion</span>}
                    </button>
                </div>
            </aside>
        </>
    )
}
