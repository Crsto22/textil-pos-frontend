"use client"

import { useCallback, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { ProductoImportResponse } from "@/lib/types/producto"

const ALLOWED_FILE_EXTENSIONS = [".xlsx", ".xls"]

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

function hasAllowedExtension(fileName: string): boolean {
  const lowerName = fileName.trim().toLowerCase()
  return ALLOWED_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
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
    async (file: File): Promise<ProductoImportResult> => {
      if (isImporting) {
        return { ok: false, message: "Ya hay una importacion en proceso" }
      }

      if (!(file instanceof File)) {
        return { ok: false, message: "Debe seleccionar un archivo valido" }
      }

      if (file.size <= 0) {
        return { ok: false, message: "El archivo no puede estar vacio" }
      }

      if (!hasAllowedExtension(file.name)) {
        return { ok: false, message: "Solo se permiten archivos .xlsx o .xls" }
      }

      setIsImporting(true)

      try {
        const formData = new FormData()
        formData.append("file", file, file.name)

        const response = await authFetch("/api/producto/importar", {
          method: "POST",
          body: formData,
        })
        const payload = await parseJsonSafe(response)

        if (!response.ok) {
          return {
            ok: false,
            message: getResponseMessage(payload, "No se pudo importar el archivo"),
            status: response.status,
          }
        }

        const normalized = normalizeImportResponse(payload)
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

