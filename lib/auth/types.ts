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

export interface AuthUser {
  idUsuario: number
  nombre: string
  apellido: string
  correo: string
  dni: string
  telefono: string
  rol: string
  fechaCreacion: string
  idSucursal: number | null
  nombreSucursal: string
}

/** Respuesta que el BFF devuelve al cliente (login y refresh) */
export interface AuthResponse {
  access_token: string
  user: AuthUser | null
}

/** Respuesta JSON del backend en POST /api/auth/autenticarse (200) */
export interface BackendLoginResponse {
  access_token: string
  idUsuario: number
  nombre: string
  apellido: string
  correo: string
  dni: string
  telefono: string
  rol: string
  fechaCreacion: string
  idSucursal: number | null
  nombreSucursal: string
}

export interface AuthError {
  message: string
}
