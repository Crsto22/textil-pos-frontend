"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth/auth-fetch"
import { resolvePagoDateRange, validatePagoFilters } from "@/lib/pago-filters"
import type { PagoFilters } from "@/lib/types/pago"

interface ExportPagoReportePdfParams extends PagoFilters {
  idVenta?: number | null
  desde?: string
  hasta?: string
}

function buildQueryString(params: ExportPagoReportePdfParams): string {
  const searchParams = new URLSearchParams()

  if (params.search && params.search.trim().length > 0) {
    searchParams.set("q", params.search.trim())
  }

  if (typeof params.idVenta === "number" && params.idVenta > 0) {
    searchParams.set("idVenta", String(params.idVenta))
  }

  if (typeof params.idUsuario === "number" && params.idUsuario > 0) {
    searchParams.set("idUsuario", String(params.idUsuario))
  }

  if (typeof params.idMetodoPago === "number" && params.idMetodoPago > 0) {
    searchParams.set("idMetodoPago", String(params.idMetodoPago))
  }

  if (typeof params.idSucursal === "number" && params.idSucursal > 0) {
    searchParams.set("idSucursal", String(params.idSucursal))
  }

  if (params.desde) {
    searchParams.set("desde", params.desde)
  }

  if (params.hasta) {
    searchParams.set("hasta", params.hasta)
  }

  return searchParams.toString()
}

function extractFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null

  const encodedFilenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedFilenameMatch?.[1]) {
    try {
      return decodeURIComponent(encodedFilenameMatch[1])
    } catch {
      return encodedFilenameMatch[1]
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  return filenameMatch?.[1] ?? null
}

function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function getErrorMessage(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { message?: unknown } | null
  if (typeof payload?.message === "string" && payload.message.trim().length > 0) {
    return payload.message
  }

  if (response.status === 400) return "Filtros invalidos para exportar el reporte"
  if (response.status === 403) return "No autenticado o sin permisos"
  return "No se pudo exportar el reporte de pagos en PDF"
}

function buildFallbackFilename() {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 19).replaceAll("-", "").replaceAll(":", "").replace("T", "_")
  return `reporte_pagos_${datePart}.pdf`
}

export function usePagoReportePdf() {
  const [isExporting, setIsExporting] = useState(false)

  const exportReportePdf = useCallback(
    async (params: ExportPagoReportePdfParams): Promise<boolean> => {
      const validationError = validatePagoFilters(params)
      if (validationError) {
        toast.error(validationError)
        return false
      }

      const { desde, hasta } = resolvePagoDateRange(params)

      setIsExporting(true)
      try {
        const queryString = buildQueryString({
          ...params,
          desde,
          hasta,
        })
        const endpoint = queryString
          ? `/api/pago/reporte/pdf?${queryString}`
          : "/api/pago/reporte/pdf"

        const response = await authFetch(endpoint, {
          method: "GET",
        })

        if (!response.ok) {
          const message = await getErrorMessage(response)
          toast.error(message)
          return false
        }

        const fileBlob = await response.blob()
        if (fileBlob.size === 0) {
          toast.error("El archivo PDF llego vacio")
          return false
        }

        const filename =
          extractFilename(response.headers.get("content-disposition")) ??
          buildFallbackFilename()

        triggerDownload(filename, fileBlob)
        toast.success("Reporte PDF descargado")
        return true
      } catch {
        toast.error("Error de red al exportar el reporte PDF")
        return false
      } finally {
        setIsExporting(false)
      }
    },
    []
  )

  return {
    isExporting,
    exportReportePdf,
  }
}
