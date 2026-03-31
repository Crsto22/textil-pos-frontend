"use client"

import { useCallback, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import { getCotizacionErrorMessage, normalizeCotizacionResponse } from "@/lib/cotizacion"
import type { CotizacionResponse } from "@/lib/types/cotizacion"

interface CotizacionDetalleState {
  open: boolean
  cotizacionId: number | null
  detalle: CotizacionResponse | null
  loading: boolean
  error: string | null
}

export function useCotizacionDetalle() {
  const abortRef = useRef<AbortController | null>(null)
  const [state, setState] = useState<CotizacionDetalleState>({
    open: false,
    cotizacionId: null,
    detalle: null,
    loading: false,
    error: null,
  })

  const fetchDetalle = useCallback(async (idCotizacion: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState((previous) => ({
      ...previous,
      open: true,
      cotizacionId: idCotizacion,
      loading: true,
      error: null,
    }))

    try {
      const response = await authFetch(`/api/cotizacion/detalle/${idCotizacion}`, {
        cache: "no-store",
        signal: controller.signal,
      })
      const payload = await response.json().catch(() => null)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message = getCotizacionErrorMessage(
          payload,
          `Error ${response.status} al cargar detalle de cotizacion`
        )

        setState((previous) => ({
          ...previous,
          detalle: null,
          loading: false,
          error: message,
        }))
        return
      }

      const detalle = normalizeCotizacionResponse(payload)
      if (!detalle) {
        setState((previous) => ({
          ...previous,
          detalle: null,
          loading: false,
          error: "El detalle de cotizacion no tiene el formato esperado",
        }))
        return
      }

      setState((previous) => ({
        ...previous,
        detalle,
        loading: false,
        error: null,
      }))
    } catch (requestError) {
      if (controller.signal.aborted) return
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar el detalle de la cotizacion"
      setState((previous) => ({
        ...previous,
        detalle: null,
        loading: false,
        error: message,
      }))
    }
  }, [])

  const openCotizacionDetalle = useCallback(
    async (idCotizacion: number) => {
      if (!Number.isFinite(idCotizacion) || idCotizacion <= 0) return
      await fetchDetalle(idCotizacion)
    },
    [fetchDetalle]
  )

  const retryCotizacionDetalle = useCallback(async () => {
    if (!state.cotizacionId) return
    await fetchDetalle(state.cotizacionId)
  }, [fetchDetalle, state.cotizacionId])

  const closeCotizacionDetalle = useCallback(() => {
    abortRef.current?.abort()
    setState((previous) => ({
      ...previous,
      open: false,
      loading: false,
    }))
  }, [])

  return {
    ...state,
    openCotizacionDetalle,
    retryCotizacionDetalle,
    closeCotizacionDetalle,
  }
}
