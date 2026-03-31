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
    idEmpresa: number | null
    nombreEmpresa: string
    idUsuarioCreacion: number | null
    nombreUsuarioCreacion: string
}

export interface ClienteUltimaCompra {
    idVenta: number
    fecha: string
    tipoComprobante: string
    serie: string
    correlativo: number
    moneda: string
    total: number
    estado: string
}

export interface ClienteDetalle extends Cliente {
    comprasTotales: number
    montoTotalCompras: number
    ultimasCompras: ClienteUltimaCompra[]
}

/* ── Tipo de documento ───────────────────────────────────── */

export const TIPO_DOCUMENTO_VALUES = ["SIN_DOC", "DNI", "RUC", "CE"] as const
export type TipoDocumento = (typeof TIPO_DOCUMENTO_VALUES)[number]
export const ALL_CLIENTE_DOCUMENT_FILTER = "ALL" as const
export type ClienteTipoDocumentoFilter =
    | TipoDocumento
    | typeof ALL_CLIENTE_DOCUMENT_FILTER

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
}

export interface ClienteCreatePrefill {
    tipoDocumento?: TipoDocumento
    nroDocumento?: string
    nombres?: string
    telefono?: string
    correo?: string
    direccion?: string
    autoLookup?: boolean
}

export interface ClienteUpdateRequest {
    tipoDocumento: string
    nroDocumento: string
    nombres: string
    telefono: string
    correo: string
    direccion: string
    estado: string
}

export const emptyClienteCreate: ClienteCreateRequest = {
    tipoDocumento: "DNI",
    nroDocumento: "",
    nombres: "",
    telefono: "",
    correo: "",
    direccion: "",
}

export const emptyClienteUpdate: ClienteUpdateRequest = {
    tipoDocumento: "DNI",
    nroDocumento: "",
    nombres: "",
    telefono: "",
    correo: "",
    direccion: "",
    estado: "ACTIVO",
}

/**
 * Re-exportamos PageResponse para usar con Cliente.
 */
export type ClientePageResponse = PageResponse<Cliente>
