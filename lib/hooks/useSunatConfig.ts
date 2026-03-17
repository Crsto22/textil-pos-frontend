"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import {
  isSunatConfigMissing,
  normalizeSunatConfig,
  normalizeSunatConfigTestResponse,
} from "@/lib/sunat-config"
import type {
  SunatConfig,
  SunatConfigTestResponse,
  SunatConfigUpsertRequest,
} from "@/lib/types/sunat-config"

interface SunatActionResult {
  ok: boolean
  message: string
}

interface UseSunatConfigOptions {
  enabled: boolean
}

const SUNAT_CONFIG_TIMEOUT_MS = 15000

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export function useSunatConfig({ enabled }: UseSunatConfigOptions) {
  const [config, setConfig] = useState<SunatConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingCertificate, setUploadingCertificate] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<SunatConfigTestResponse | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const fetchConfig = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const timeoutId = window.setTimeout(() => {
      controller.abort("timeout")
    }, SUNAT_CONFIG_TIMEOUT_MS)

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch("/api/config/sunat", {
        signal: controller.signal,
        cache: "no-store",
      })
      const data = await parseJsonSafe(response)
      if (controller.signal.aborted) return

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data && typeof data.message === "string"
            ? data.message
            : "No se pudo cargar la configuracion SUNAT"

        if (isSunatConfigMissing(response.status, message)) {
          setConfig(null)
          setNotFound(true)
          setError(null)
          return
        }

        setConfig(null)
        setNotFound(false)
        setError(message)
        return
      }

      const normalizedConfig = normalizeSunatConfig(data)
      if (!normalizedConfig) {
        setConfig(null)
        setNotFound(false)
        setError("La respuesta de configuracion SUNAT no tiene el formato esperado")
        return
      }

      setConfig(normalizedConfig)
      setNotFound(false)
      setError(null)
    } catch (requestError) {
      if (controller.signal.aborted && controller.signal.reason === "timeout") {
        setConfig(null)
        setNotFound(false)
        setError("La carga de configuracion SUNAT excedio el tiempo de espera")
        return
      }

      if (isAbortError(requestError)) return
      setConfig(null)
      setNotFound(false)
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cargar la configuracion SUNAT"
      )
    } finally {
      window.clearTimeout(timeoutId)
      if (!controller.signal.aborted || controller.signal.reason === "timeout") {
        setLoading(false)
      }
    }
  }, [])

  const saveConfig = useCallback(async (payload: SunatConfigUpsertRequest): Promise<SunatActionResult> => {
    setSaving(true)
    setError(null)

    try {
      const response = await authFetch("/api/config/sunat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await parseJsonSafe(response)

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data && typeof data.message === "string"
            ? data.message
            : "No se pudo guardar la configuracion SUNAT"
        setError(message)
        return { ok: false, message }
      }

      const normalizedConfig = normalizeSunatConfig(data)
      setConfig(normalizedConfig)
      setNotFound(false)
      setError(null)
      return {
        ok: true,
        message: "Configuracion SUNAT guardada correctamente",
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar la configuracion SUNAT"
      setError(message)
      return { ok: false, message }
    } finally {
      setSaving(false)
    }
  }, [])

  const uploadCertificate = useCallback(
    async (file: File, certificadoPassword?: string): Promise<SunatActionResult> => {
      setUploadingCertificate(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append("file", file)
        if (certificadoPassword?.trim()) {
          formData.append("certificadoPassword", certificadoPassword.trim())
        }

        const response = await authFetch("/api/config/sunat/certificado", {
          method: "POST",
          body: formData,
        })
        const data = await parseJsonSafe(response)

        if (!response.ok) {
          const message =
            data &&
            typeof data === "object" &&
            "message" in data &&
            typeof data.message === "string"
              ? data.message
              : "No se pudo subir el certificado digital"
          setError(message)
          return { ok: false, message }
        }

        const normalizedConfig = normalizeSunatConfig(data)
        setConfig(normalizedConfig)
        setNotFound(false)
        setError(null)
        return {
          ok: true,
          message: "Certificado digital actualizado correctamente",
        }
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "No se pudo subir el certificado digital"
        setError(message)
        return { ok: false, message }
      } finally {
        setUploadingCertificate(false)
      }
    },
    []
  )

  const testConnection = useCallback(async (): Promise<SunatActionResult> => {
    setTestingConnection(true)
    setError(null)

    try {
      const response = await authFetch("/api/config/sunat/probar-conexion", {
        method: "POST",
      })
      const data = await parseJsonSafe(response)

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data && typeof data.message === "string"
            ? data.message
            : "No se pudo validar la configuracion SUNAT"
        setTestResult(null)
        setError(message)
        return { ok: false, message }
      }

      const normalizedResult = normalizeSunatConfigTestResponse(data)
      if (!normalizedResult) {
        const message = "La respuesta de prueba SUNAT no tiene el formato esperado"
        setTestResult(null)
        setError(message)
        return { ok: false, message }
      }

      setTestResult(normalizedResult)
      setError(null)
      return { ok: true, message: normalizedResult.message }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudo validar la configuracion SUNAT"
      setTestResult(null)
      setError(message)
      return { ok: false, message }
    } finally {
      setTestingConnection(false)
    }
  }, [])

  const clearTestResult = useCallback(() => {
    setTestResult(null)
  }, [])

  useEffect(() => {
    if (!enabled) return
    void fetchConfig()
  }, [enabled, fetchConfig])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return {
    config,
    loading,
    error,
    notFound,
    saving,
    uploadingCertificate,
    testingConnection,
    testResult,
    fetchConfig,
    saveConfig,
    uploadCertificate,
    testConnection,
    clearTestResult,
  }
}
