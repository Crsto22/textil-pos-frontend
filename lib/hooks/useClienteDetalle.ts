"use client"

import { useCallback, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { ClienteDetalle, ClienteUltimaCompra } from "@/lib/types/cliente"

interface ClienteDetalleState {
    clienteId: number | null
    detalle: ClienteDetalle | null
    loading: boolean
    error: string | null
}

function numberOr(value: unknown, fallback = 0): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

function nullableNumber(value: unknown): number | null {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

function stringOr(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback
}

function parseUltimasCompras(value: unknown): ClienteUltimaCompra[] {
    if (!Array.isArray(value)) return []

    return value
        .map((item): ClienteUltimaCompra | null => {
            if (!item || typeof item !== "object") return null
            const data = item as Record<string, unknown>
            const idVenta = numberOr(data.idVenta)
            if (idVenta <= 0) return null

            return {
                idVenta,
                fecha: stringOr(data.fecha),
                tipoComprobante: stringOr(data.tipoComprobante, "COMPROBANTE"),
                serie: stringOr(data.serie),
                correlativo: numberOr(data.correlativo),
                moneda: stringOr(data.moneda, "PEN"),
                total: numberOr(data.total),
                estado: stringOr(data.estado, "DESCONOCIDO"),
            }
        })
        .filter((item): item is ClienteUltimaCompra => item !== null)
}

function parseClienteDetalle(value: unknown): ClienteDetalle | null {
    if (!value || typeof value !== "object") return null

    const payload = value as Record<string, unknown>
    const idCliente = numberOr(payload.idCliente)
    if (idCliente <= 0) return null

    return {
        idCliente,
        tipoDocumento: stringOr(payload.tipoDocumento),
        nroDocumento: stringOr(payload.nroDocumento),
        nombres: stringOr(payload.nombres),
        telefono: stringOr(payload.telefono),
        correo: stringOr(payload.correo),
        direccion: stringOr(payload.direccion),
        estado: stringOr(payload.estado, "ACTIVO"),
        fechaCreacion: stringOr(payload.fechaCreacion),
        idEmpresa: nullableNumber(payload.idEmpresa),
        nombreEmpresa: stringOr(payload.nombreEmpresa),
        idUsuarioCreacion: nullableNumber(payload.idUsuarioCreacion),
        nombreUsuarioCreacion: stringOr(payload.nombreUsuarioCreacion),
        comprasTotales: numberOr(payload.comprasTotales),
        montoTotalCompras: numberOr(payload.montoTotalCompras),
        ultimasCompras: parseUltimasCompras(payload.ultimasCompras),
    }
}

function getResponseMessage(payload: unknown, fallback: string): string {
    if (!payload || typeof payload !== "object") return fallback

    const data = payload as Record<string, unknown>
    if (typeof data.message === "string" && data.message.trim()) {
        return data.message
    }

    return fallback
}

export function useClienteDetalle() {
    const abortRef = useRef<AbortController | null>(null)
    const [state, setState] = useState<ClienteDetalleState>({
        clienteId: null,
        detalle: null,
        loading: false,
        error: null,
    })

    const fetchDetalle = useCallback(async (idCliente: number) => {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setState({
            clienteId: idCliente,
            detalle: null,
            loading: true,
            error: null,
        })

        try {
            const response = await authFetch(`/api/cliente/detalle/${idCliente}`, {
                cache: "no-store",
                signal: controller.signal,
            })
            const payload = await response.json().catch(() => null)
            if (controller.signal.aborted) return

            if (!response.ok) {
                setState({
                    clienteId: idCliente,
                    detalle: null,
                    loading: false,
                    error: getResponseMessage(
                        payload,
                        `Error ${response.status} al cargar detalle del cliente`
                    ),
                })
                return
            }

            const detalle = parseClienteDetalle(payload)
            if (!detalle) {
                setState({
                    clienteId: idCliente,
                    detalle: null,
                    loading: false,
                    error: "El detalle del cliente no tiene el formato esperado",
                })
                return
            }

            setState({
                clienteId: idCliente,
                detalle,
                loading: false,
                error: null,
            })
        } catch (requestError) {
            if (controller.signal.aborted) return

            setState({
                clienteId: idCliente,
                detalle: null,
                loading: false,
                error:
                    requestError instanceof Error
                        ? requestError.message
                        : "No se pudo cargar el detalle del cliente",
            })
        }
    }, [])

    const openClienteDetalle = useCallback(
        async (idCliente: number) => {
            if (!Number.isFinite(idCliente) || idCliente <= 0) return
            await fetchDetalle(idCliente)
        },
        [fetchDetalle]
    )

    const retryClienteDetalle = useCallback(async () => {
        if (!state.clienteId) return
        await fetchDetalle(state.clienteId)
    }, [fetchDetalle, state.clienteId])

    const closeClienteDetalle = useCallback(() => {
        abortRef.current?.abort()
        setState({
            clienteId: null,
            detalle: null,
            loading: false,
            error: null,
        })
    }, [])

    return {
        ...state,
        openClienteDetalle,
        retryClienteDetalle,
        closeClienteDetalle,
    }
}
