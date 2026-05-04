"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { GuiaRemisionDetail } from "@/lib/types/guia-remision"

import { GuiaRemisionDetalleContent } from "./GuiaRemisionDetalleContent"

interface GuiaRemisionDetallePageProps {
  guiaId: number
}

export function GuiaRemisionDetallePage({ guiaId }: GuiaRemisionDetallePageProps) {
  const [detail, setDetail] = useState<GuiaRemisionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consultingCdr, setConsultingCdr] = useState(false)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await authFetch(`/api/guia-remision/${guiaId}`)
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setError(data?.message || "No se pudo obtener el detalle de la guia")
        return
      }
      setDetail(data as GuiaRemisionDetail)
    } catch {
      setError("Error de conexion al obtener el detalle")
    } finally {
      setLoading(false)
    }
  }, [guiaId])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  const handleConsultarCdr = useCallback(async () => {
    setConsultingCdr(true)
    try {
      const response = await authFetch(
        `/api/guia-remision/${guiaId}/consultar-cdr`,
        { method: "POST" }
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        toast.error(data?.message || "No se pudo consultar el CDR de la guia")
        return
      }

      toast.success(data?.message || "Consulta de CDR ejecutada correctamente")
      await fetchDetail()
    } catch {
      toast.error("Error de conexion al consultar el CDR")
    } finally {
      setConsultingCdr(false)
    }
  }, [fetchDetail, guiaId])

  return (
    <div className="w-full space-y-6">
      <GuiaRemisionDetalleContent
        detail={detail}
        loading={loading}
        error={error}
        onRetry={() => {
          void fetchDetail()
        }}
        onConsultarCdr={() => {
          void handleConsultarCdr()
        }}
        consultingCdr={consultingCdr}
      />
    </div>
  )
}
