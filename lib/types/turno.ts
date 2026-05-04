export const DIAS_SEMANA = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
] as const

export type DiaSemana = (typeof DIAS_SEMANA)[number]

export const DIA_LABEL: Record<DiaSemana, string> = {
  LUNES: "Lun",
  MARTES: "Mar",
  MIERCOLES: "Mié",
  JUEVES: "Jue",
  VIERNES: "Vie",
  SABADO: "Sáb",
  DOMINGO: "Dom",
}

export interface Turno {
  idTurno: number
  nombre: string
  horaInicio: string
  horaFin: string
  dias: DiaSemana[]
  estado: string
  fechaCreacion: string
}

export interface TurnoCreateRequest {
  nombre: string
  horaInicio: string
  horaFin: string
  dias: DiaSemana[]
}

export interface TurnoUpdateRequest extends TurnoCreateRequest {
  estado: string
}

export interface TurnoDeleteResponse {
  message: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}
