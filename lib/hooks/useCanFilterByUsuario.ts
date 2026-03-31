"use client"

import { useMemo } from "react"

import { useAuth } from "@/lib/auth/auth-context"

function isAdminRole(role: string | null | undefined): boolean {
  return role?.toUpperCase() === "ADMINISTRADOR"
}

function useCanFilterByAdminRole(): boolean {
  const { user } = useAuth()

  return useMemo(() => isAdminRole(user?.rol), [user?.rol])
}

export function useCanFilterByUsuario(): boolean {
  return useCanFilterByAdminRole()
}

export function useCanFilterBySucursal(): boolean {
  return useCanFilterByAdminRole()
}
