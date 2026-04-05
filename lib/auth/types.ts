import type { UsuarioSesionResponse } from "@/lib/types/usuario"

// Tipos compartidos para autenticacion

export interface LoginRequest {
  email: string
  password: string
}

export interface ChangePasswordRequest {
  passwordActual: string
  passwordNueva: string
  confirmarPassword: string
}

export type AuthUser = Omit<UsuarioSesionResponse, "access_token">

/** Respuesta que el BFF devuelve al cliente (login y refresh) */
export interface AuthResponse {
  access_token: string
  user: AuthUser | null
}

/** Respuesta JSON del backend en POST /api/auth/autenticarse (200) */
export type BackendLoginResponse = UsuarioSesionResponse

export interface AuthError {
  message: string
}
