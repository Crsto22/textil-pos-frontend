// Tipos compartidos para autenticación

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthUser {
  idUsuario: number
  nombre: string
  apellido: string
  rol: string
  idSucursal: number
}

/** Respuesta que el BFF devuelve al cliente (login y refresh) */
export interface AuthResponse {
  access_token: string
  user: AuthUser
}

/** Respuesta JSON del backend en POST /api/auth/autenticarse (200) */
export interface BackendLoginResponse {
  access_token: string
  idUsuario: number
  nombre: string
  apellido: string
  rol: string
  idSucursal: number
}

export interface AuthError {
  message: string
}
