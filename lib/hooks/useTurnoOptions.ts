"use client"

import { useEffect, useMemo, useState } from "react"

import { authFetch } from "@/lib/auth/auth-fetch"
import { useDebouncedValue, SEARCH_DEBOUNCE_MS } from "@/lib/hooks/useDebouncedValue"
import { DIA_LABEL, type DiaSemana, type Turno, type PageResponse } from "@/lib/types/turno"
import type { ComboboxOption } from "@/components/ui/combobox"

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export type TurnoOption = ComboboxOption

function buildTurnoLabel(turno: Pick<Turno, "nombre" | "horaInicio" | "horaFin">): string {
  const horario = [turno.horaInicio, turno.horaFin].filter(Boolean).join(" – ")
  return horario ? `${turno.nombre} (${horario})` : turno.nombre
}

function buildDiasDescription(dias: DiaSemana[] | undefined): string | undefined {
  if (!Array.isArray(dias) || dias.length === 0) return undefined
  return dias.map((d) => DIA_LABEL[d] ?? d.slice(0, 3)).join(" · ")
}

export function useTurnoOptions(enabled = true) {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loadingTurnos, setLoadingTurnos] = useState(false)
  const [errorTurnos, setErrorTurnos] = useState<string | null>(null)
  const [searchTurno, setSearchTurno] = useState("")
  const debouncedSearch = useDebouncedValue(searchTurno, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()

    async function loadTurnos() {
      setLoadingTurnos(true)
      setErrorTurnos(null)

      try {
        const endpoint = debouncedSearch.trim()
          ? `/api/turno/buscar?q=${encodeURIComponent(debouncedSearch.trim())}&page=0`
          : "/api/turno/listar?page=0"

        const response = await authFetch(endpoint, { signal: controller.signal })
        const data = (await parseJsonSafe(response)) as Record<string, unknown> | null

        if (!response.ok) {
          setTurnos([])
          setErrorTurnos(
            typeof data?.message === "string" && data.message.trim()
              ? data.message
              : "No se pudieron cargar los turnos"
          )
          return
        }

        setTurnos(Array.isArray(data?.content) ? (data.content as Turno[]) : [])
      } catch (error) {
        if (controller.signal.aborted) return
        setTurnos([])
        setErrorTurnos(error instanceof Error ? error.message : "Error inesperado")
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTurnos(false)
        }
      }
    }

    void loadTurnos()

    return () => controller.abort()
  }, [debouncedSearch, enabled])

  const turnoOptions = useMemo<TurnoOption[]>(
    () =>
      turnos.map((turno) => {
        const diasDesc = buildDiasDescription(turno.dias)
        return {
          value: String(turno.idTurno),
          label: buildTurnoLabel(turno),
          description: diasDesc,
          triggerDescription: diasDesc,
        }
      }),
    [turnos]
  )

  const getTurnoOptionById = (idTurno: number, fallbackName?: string | null): TurnoOption => {
    const found = turnos.find((turno) => turno.idTurno === idTurno)
    if (found) {
      const diasDesc = buildDiasDescription(found.dias)
      return {
        value: String(found.idTurno),
        label: buildTurnoLabel(found),
        description: diasDesc,
        triggerDescription: diasDesc,
      }
    }

    return {
      value: String(idTurno),
      label: fallbackName?.trim() ? fallbackName : `Turno #${idTurno}`,
    }
  }

  return {
    turnoOptions,
    loadingTurnos,
    errorTurnos,
    searchTurno,
    setSearchTurno,
    getTurnoOptionById,
  }
}
