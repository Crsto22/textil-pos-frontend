"use client"

import { useEffect, useMemo, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/lib/hooks/useDebouncedValue"
import type { CargoTrabajador, DispositivoAsistencia, Trabajador } from "@/lib/types/asistencia"

type OptionKind = "trabajadores" | "dispositivos-asistencia" | "asistencia/cargos"

export function useAsistenciaOptions(kind: OptionKind, enabled = true) {
  const [items, setItems] = useState<Array<Trabajador | DispositivoAsistencia | CargoTrabajador>>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const params = new URLSearchParams({ page: "0" })
    if (kind === "asistencia/cargos") params.set("estado", "ACTIVO")
    if (debounced.trim()) params.set("q", debounced.trim())

    async function load() {
      setLoading(true)
      try {
        const response = await authFetch(`/api/${kind}?${params}`, { signal: controller.signal })
        const data = await response.json().catch(() => null)
        if (!response.ok || !Array.isArray(data?.content)) {
          if (!controller.signal.aborted) setItems([])
          return
        }
        const pages = Number(data.totalPages) || 1
        const remaining = await Promise.all(
          Array.from({ length: Math.max(0, pages - 1) }, async (_, index) => {
            const pageParams = new URLSearchParams(params)
            pageParams.set("page", String(index + 1))
            const next = await authFetch(`/api/${kind}?${pageParams}`, { signal: controller.signal })
            const payload = await next.json().catch(() => null)
            return next.ok && Array.isArray(payload?.content) ? payload.content : []
          })
        )
        if (!controller.signal.aborted) setItems([...(data.content), ...remaining.flat()])
      } catch {
        if (!controller.signal.aborted) setItems([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [debounced, enabled, kind])

  const options = useMemo(
    () => items.map((item) => {
      if (kind === "trabajadores") {
        const worker = item as Trabajador
        return { value: String(worker.idTrabajador), label: `${worker.apellidos}, ${worker.nombres}`, description: `Codigo ${worker.codigoZkteco}` }
      }
      if (kind === "asistencia/cargos") {
        const cargo = item as CargoTrabajador
        return { value: String(cargo.idCargo), label: cargo.nombre }
      }
      const device = item as DispositivoAsistencia
      return { value: String(device.idDispositivo), label: device.nombre, description: device.numeroSerie }
    }),
    [items, kind]
  )

  return { options, search, setSearch, loading }
}
