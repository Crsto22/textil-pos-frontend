"use client"

import { useMemo } from "react"

import { useAuth } from "@/lib/auth/auth-context"
import { isAdministratorRole } from "@/lib/auth/roles"

function useCanFilterByAdminRole(): boolean {
  const { user } = useAuth()

  return useMemo(() => isAdministratorRole(user?.rol), [user?.rol])
}

export function useCanFilterByUsuario(): boolean {
  return useCanFilterByAdminRole()
}

export function useCanFilterBySucursal(): boolean {
  return useCanFilterByAdminRole()
}
