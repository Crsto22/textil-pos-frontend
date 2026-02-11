"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { LoaderOverlay } from "@/components/ui/loader-overlay"
import { useEffect, type ReactNode } from "react"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) return <LoaderOverlay />
  if (!isAuthenticated) return null

  return (
    <>
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
    </>
  )
}
