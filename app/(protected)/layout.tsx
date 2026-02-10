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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/")
    }
  }, [isLoading, isAuthenticated, router])

  if (!isAuthenticated && !isLoading) return null

  return (
    <>
      {isLoading && <LoaderOverlay />}
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col lg:ml-[260px] min-w-0 transition-all duration-300">
          <Header onMenuToggle={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[oklch(0.1_0_0)] p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
