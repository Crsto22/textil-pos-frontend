// Tipos para el modulo de Clientes

import type { PageResponse } from "@/lib/types/usuario"

export const CLIENTE_ESTADOS = ["ACTIVO", "INACTIVO"] as const

export type ClienteEstado = (typeof CLIENTE_ESTADOS)[number]
export const ALL_CLIENTE_ESTADO_FILTER = "ALL" as const
export const ALL_CLIENTE_BRANCH_FILTER = "ALL" as const
export type ClienteEstadoFilter = ClienteEstado | typeof ALL_CLIENTE_ESTADO_FILTER

export interface ClienteEstadoOption {
    value: ClienteEstado
    label: string
}

export const CLIENTE_ESTADO_OPTIONS: ClienteEstadoOption[] = [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
]

export function isClienteEstado(value: string): value is ClienteEstado {
    return (CLIENTE_ESTADOS as readonly string[]).includes(value)
}

export interface Cliente {
    idCliente: number
    tipoDocumento: string
    nroDocumento: string
    nombres: string
    telefono: string
    correo: string
    direccion: string
    estado: "ACTIVO" | "INACTIVO" | string
    fechaCreacion: string
    idSucursal: number | null
    nombreSucursal: string
    idUsuarioCreacion: number | null
    nombreUsuarioCreacion: string
}

/* ── Tipo de documento ───────────────────────────────────── */

export const TIPO_DOCUMENTO_VALUES = ["SIN_DOC", "DNI", "RUC", "CE"] as const
export type TipoDocumento = (typeof TIPO_DOCUMENTO_VALUES)[number]

export interface TipoDocumentoOption {
    value: TipoDocumento
    label: string
    minLength: number
    maxLength: number
    /** true = alfanumérico, false = solo dígitos */
    alphanumeric?: boolean
}

export const TIPO_DOCUMENTO_OPTIONS: TipoDocumentoOption[] = [
    { value: "SIN_DOC", label: "Sin documento", minLength: 0, maxLength: 0 },
    { value: "DNI", label: "DNI", minLength: 8, maxLength: 8 },
    { value: "RUC", label: "RUC", minLength: 11, maxLength: 11 },
    { value: "CE", label: "Carné de Extranjería", minLength: 6, maxLength: 20, alphanumeric: true },
]

export function isTipoDocumento(value: string): value is TipoDocumento {
    return (TIPO_DOCUMENTO_VALUES as readonly string[]).includes(value)
}

export function getTipoDocumentoOption(value: string): TipoDocumentoOption | undefined {
    return TIPO_DOCUMENTO_OPTIONS.find((opt) => opt.value === value)
}

/* ── Requests ────────────────────────────────────────────── */

export interface ClienteCreateRequest {
    tipoDocumento: string
    nroDocumento: string
    nombres: string
    telefono: string
    correo: string
    direccion: string
    idSucursal: number | null
}

export interface ClienteUpdateRequest {
    tipoDocumento: string
    nroDocumento: string
    nombres: string
    telefono: string
    correo: string
    direccion: string
    estado: string
    idSucursal: number | null
}

export const emptyClienteCreate: ClienteCreateRequest = {
    tipoDocumento: "DNI",
    nroDocumento: "",
    nombres: "",
    telefono: "",
    correo: "",
    direccion: "",
    idSucursal: null,
}

export const emptyClienteUpdate: ClienteUpdateRequest = {
    tipoDocumento: "DNI",
    nroDocumento: "",
    nombres: "",
    telefono: "",
    correo: "",
    direccion: "",
    estado: "ACTIVO",
    idSucursal: null,
}

/**
 * Re-exportamos PageResponse para usar con Cliente.
 */
export type ClientePageResponse = PageResponse<Cliente>
