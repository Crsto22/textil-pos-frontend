"use client"

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export interface SucursalGlobal {
  idSucursal: number
  nombre: string
}

interface SucursalGlobalContextType {
  sucursalGlobal: SucursalGlobal | null
  setSucursalGlobal: (sucursal: SucursalGlobal | null) => void
}

const STORAGE_KEY = "pos_sucursal_global"

const SucursalGlobalContext = createContext<SucursalGlobalContextType | null>(null)

export function SucursalGlobalProvider({ children }: { children: ReactNode }) {
  const [sucursalGlobal, setSucursalGlobalState] = useState<SucursalGlobal | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as unknown
      if (
        parsed &&
        typeof parsed === "object" &&
        "idSucursal" in parsed &&
        "nombre" in parsed &&
        typeof (parsed as { idSucursal: unknown }).idSucursal === "number" &&
        typeof (parsed as { nombre: unknown }).nombre === "string"
      ) {
        startTransition(() => setSucursalGlobalState(parsed as SucursalGlobal))
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  const setSucursalGlobal = useCallback((sucursal: SucursalGlobal | null) => {
    setSucursalGlobalState(sucursal)
    try {
      if (sucursal) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sucursal))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  return (
    <SucursalGlobalContext.Provider value={{ sucursalGlobal, setSucursalGlobal }}>
      {children}
    </SucursalGlobalContext.Provider>
  )
}

export function useSucursalGlobal() {
  const ctx = useContext(SucursalGlobalContext)
  if (!ctx) throw new Error("useSucursalGlobal must be used within SucursalGlobalProvider")
  return ctx
}

