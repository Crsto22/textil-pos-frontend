"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import { setAccessToken, clearAccessToken } from "@/lib/auth/token-store"
import type { AuthUser, LoginRequest, AuthResponse } from "@/lib/auth/types"

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<{ ok: boolean; message?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Al montar, intentar refresh silencioso para restaurar sesión (soluciona F5)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" })

        if (res.ok) {
          const data: AuthResponse = await res.json()
          setAccessToken(data.access_token)
          if (data.user) setUser(data.user)
        }
      } catch {
        // Sin sesión activa → mostrar login
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(
    async (credentials: LoginRequest): Promise<{ ok: boolean; message?: string }> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        })

        const data = await res.json()

        if (!res.ok) {
          return { ok: false, message: data.message }
        }

        const { access_token, user: userData } = data as AuthResponse

        setAccessToken(access_token)
        setUser(userData)

        return { ok: true }
      } catch {
        return { ok: false, message: "Error de conexión. Intente nuevamente." }
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Limpiar estado aunque falle la petición
    } finally {
      clearAccessToken()
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>")
  }
  return context
}
