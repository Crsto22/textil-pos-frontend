"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { hasAccess, getDefaultRoute } from "@/lib/auth/permissions"
import { LoaderOverlay } from "@/components/ui/loader-overlay"
import { useEffect, type ReactNode } from "react"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { SucursalGlobalProvider } from "@/lib/sucursal-global-context"

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/")
      return
    }

    if (!isLoading && isAuthenticated && user) {
      if (!hasAccess(user.rol, pathname)) {
        router.replace(getDefaultRoute(user.rol))
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router])

  if (isLoading) return <LoaderOverlay />
  if (!isAuthenticated) return null
  if (user && !hasAccess(user.rol, pathname)) return <LoaderOverlay /> // Optional check to prevent rendering flash before redirect

  return (
    <SucursalGlobalProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />
        <div
          className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${
            sidebarCollapsed ? "lg:ml-[88px]" : "lg:ml-[260px]"
          }`}
        >
          <Header onMenuToggle={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[oklch(0.1_0_0)] p-6">
            {children}
          </main>
        </div>
      </div>
    </SucursalGlobalProvider>
  )
}
