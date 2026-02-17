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

  const fetchCurrentUser = useCallback(
    async (accessToken: string): Promise<AuthUser | null> => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!res.ok) return null

        const data = (await res.json()) as AuthUser
        return data
      } catch {
        return null
      }
    },
    []
  )

  // Al montar, intenta refresh silencioso para restaurar sesion.
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" })

        if (res.ok) {
          const data: AuthResponse = await res.json()
          setAccessToken(data.access_token)
          const currentUser = await fetchCurrentUser(data.access_token)
          setUser(currentUser ?? data.user ?? null)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [fetchCurrentUser])

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
        const currentUser = await fetchCurrentUser(access_token)
        setUser(currentUser ?? userData ?? null)

        return { ok: true }
      } catch {
        return { ok: false, message: "Error de conexion. Intente nuevamente." }
      }
    },
    [fetchCurrentUser]
  )

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Limpiar estado aunque falle la peticion
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
