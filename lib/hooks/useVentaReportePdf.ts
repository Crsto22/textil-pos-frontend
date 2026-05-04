"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { VentaListadoPeriodo } from "@/lib/types/venta"

interface ExportVentaReportePdfParams {
  periodo: VentaListadoPeriodo
  desde?: string
  hasta?: string
  idUsuario?: number | null
  idSucursal?: number | null
  idCliente?: number | null
  tiposComprobante?: string[]
  incluirAnuladas?: boolean
}

function buildQueryString(params: ExportVentaReportePdfParams): string {
  const searchParams = new URLSearchParams()
  searchParams.set("periodo", params.periodo)

  if (params.desde) {
    searchParams.set("desde", params.desde)
  }

  if (params.hasta) {
    searchParams.set("hasta", params.hasta)
  }

  if (typeof params.idUsuario === "number" && params.idUsuario > 0) {
    searchParams.set("idUsuario", String(params.idUsuario))
  }

  if (typeof params.idSucursal === "number" && params.idSucursal > 0) {
    searchParams.set("idSucursal", String(params.idSucursal))
  }

  if (typeof params.idCliente === "number" && params.idCliente > 0) {
    searchParams.set("idCliente", String(params.idCliente))
  }

  params.tiposComprobante?.forEach((tipo) => {
    const normalizedTipo = tipo.trim()
    if (normalizedTipo) {
      searchParams.append("tipoComprobante", normalizedTipo)
    }
  })

  if (params.incluirAnuladas === true) {
    searchParams.set("incluirAnuladas", "true")
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
  if (response.status === 400) return "Filtros invalidos para exportar el reporte PDF"
  if (response.status === 403) return "No autenticado o sin permisos"
  if (response.status === 404) return "No se encontro informacion para el reporte PDF"
  return "No se pudo exportar el reporte de ventas en PDF"
}

function buildFallbackFilename() {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "")
  return `reporte_ventas_${datePart}.pdf`
}

export function useVentaReportePdf() {
  const [isExporting, setIsExporting] = useState(false)

  const exportReportePdf = useCallback(
    async (params: ExportVentaReportePdfParams): Promise<boolean> => {
      setIsExporting(true)
      try {
        const queryString = buildQueryString(params)
        const endpoint = queryString
          ? `/api/venta/reporte/pdf?${queryString}`
          : "/api/venta/reporte/pdf"

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
