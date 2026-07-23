"use client"

import { useCallback, useEffect, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import type { PageResponse } from "@/lib/types/asistencia"

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export function getAsistenciaError(status: number, message?: string): string {
  if (message) return message
  if (status === 401) return "Sesion expirada, vuelve a iniciar sesion"
  if (status === 403) return "No tienes permisos"
  return "No se pudo completar la operacion"
}

export function useAsistenciaPage<T>(endpoint: string) {
  const [data, setData] = useState<PageResponse<T>>({
    content: [], page: 0, size: 0, totalPages: 0, totalElements: 0, first: true, last: true,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    if (!endpoint) {
      setLoading(false)
      setError(null)
      setData((previous) => ({ ...previous, content: [], totalPages: 0, totalElements: 0 }))
      return
    }
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await authFetch(endpoint, { signal: controller.signal })
        const payload = await parseJsonSafe(response)
        if (controller.signal.aborted) return
        if (!response.ok) {
          setError(getAsistenciaError(response.status, payload?.message))
          setData((previous) => ({ ...previous, content: [], totalPages: 0, totalElements: 0 }))
          return
        }
        setData({
          content: Array.isArray(payload?.content) ? payload.content : [],
          page: Number(payload?.page) || 0,
          size: Number(payload?.size) || 0,
          totalPages: Number(payload?.totalPages) || 0,
          totalElements: Number(payload?.totalElements) || 0,
          first: payload?.first !== false,
          last: payload?.last !== false,
        })
      } catch (requestError) {
        if (controller.signal.aborted) return
        setError(requestError instanceof Error ? requestError.message : "Error inesperado")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [endpoint, refreshToken])

  const refresh = useCallback(() => setRefreshToken((value) => value + 1), [])
  return { ...data, loading, error, refresh }
}

export function useAsistenciaData<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    if (!endpoint) {
      setLoading(false)
      setError(null)
      setData(null)
      return
    }
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await authFetch(endpoint, { signal: controller.signal })
        const payload = await parseJsonSafe(response)
        if (controller.signal.aborted) return
        if (!response.ok) {
          setError(getAsistenciaError(response.status, payload?.message))
          setData(null)
          return
        }
        setData(payload as T)
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Error inesperado")
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [endpoint, refreshToken])

  const refresh = useCallback(() => setRefreshToken((value) => value + 1), [])
  return { data, loading, error, refresh }
}

export async function asistenciaMutation<T>(
  endpoint: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<{ ok: boolean; status: number; data: T | null; message?: string }> {
  try {
    const response = await authFetch(endpoint, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await parseJsonSafe(response)
    return {
      ok: response.ok,
      status: response.status,
      data: data as T | null,
      message: response.ok ? data?.message : getAsistenciaError(response.status, data?.message),
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      message: error instanceof Error ? error.message : "Error inesperado",
    }
  }
}
