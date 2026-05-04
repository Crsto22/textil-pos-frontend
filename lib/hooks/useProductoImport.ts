"use client"

import { useCallback, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { ProductoImportRequest, ProductoImportResponse } from "@/lib/types/producto"

interface ImportSuccessResult {
  ok: true
  data: ProductoImportResponse
}

interface ImportErrorResult {
  ok: false
  message: string
  status?: number
}

export type ProductoImportResult = ImportSuccessResult | ImportErrorResult

function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

function parseNonNegativeInt(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
}

function normalizeImportResponse(payload: unknown): ProductoImportResponse | null {
  if (!payload || typeof payload !== "object") return null

  const response = payload as Record<string, unknown>

  const filasProcesadas = parseNonNegativeInt(response.filasProcesadas)
  const productosCreados = parseNonNegativeInt(response.productosCreados)
  const productosActualizados = parseNonNegativeInt(response.productosActualizados)
  const variantesGuardadas = parseNonNegativeInt(response.variantesGuardadas)
  const coloresCreados = parseNonNegativeInt(response.coloresCreados)
  const tallasCreadas = parseNonNegativeInt(response.tallasCreadas)

  if (
    filasProcesadas === null ||
    productosCreados === null ||
    productosActualizados === null ||
    variantesGuardadas === null ||
    coloresCreados === null ||
    tallasCreadas === null
  ) {
    return null
  }

  return {
    filasProcesadas,
    productosCreados,
    productosActualizados,
    variantesGuardadas,
    coloresCreados,
    tallasCreadas,
  }
}

function getResponseMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim() !== ""
  ) {
    return payload.message
  }

  return fallback
}

export function useProductoImport() {
  const [isImporting, setIsImporting] = useState(false)
  const [lastResult, setLastResult] = useState<ProductoImportResponse | null>(null)

  const importFile = useCallback(
    async (payload: ProductoImportRequest): Promise<ProductoImportResult> => {
      if (isImporting) {
        return { ok: false, message: "Ya hay una importacion en proceso" }
      }

      if (
        !payload ||
        typeof payload !== "object" ||
        !Array.isArray(payload.productos) ||
        payload.productos.length === 0
      ) {
        return { ok: false, message: "No hay productos listos para importar" }
      }

      setIsImporting(true)

      try {
        const response = await authFetch("/api/producto/importar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const responsePayload = await parseJsonSafe(response)

        if (!response.ok) {
          return {
            ok: false,
            message: getResponseMessage(responsePayload, "No se pudo importar los productos"),
            status: response.status,
          }
        }

        const normalized = normalizeImportResponse(responsePayload)
        if (!normalized) {
          return {
            ok: false,
            message: "La respuesta de importacion no tiene el formato esperado",
          }
        }

        setLastResult(normalized)
        return { ok: true, data: normalized }
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Error inesperado al importar productos",
        }
      } finally {
        setIsImporting(false)
      }
    },
    [isImporting]
  )

  return {
    isImporting,
    lastResult,
    importFile,
  }
}

