"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { LoaderOverlay } from "@/components/ui/loader-overlay"
import { useEffect, type ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isLoading, isAuthenticated, router])

  if (isAuthenticated && !isLoading) return null

  return (
    <>
      {isLoading && <LoaderOverlay />}
      {children}
    </>
  )
}
