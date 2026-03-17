import { useCallback, useEffect, useState } from "react"
import type { CatalogViewMode } from "@/lib/catalog-view"

const STORAGE_KEY = "textil-pos:catalogViewMode"
const EVENT_NAME = "catalogViewModeChanged"

export function useCatalogViewMode() {
  const [mode, setModeState] = useState<CatalogViewMode>("productos")

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored === "productos" || stored === "variantes") {
          setModeState(stored)
        }
      } catch {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue === "productos" || e.newValue === "variantes") {
          setModeState(e.newValue)
        }
      }
    }

    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<CatalogViewMode>
      if (customEvent.detail === "productos" || customEvent.detail === "variantes") {
        setModeState(customEvent.detail)
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(EVENT_NAME, handleCustom)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(EVENT_NAME, handleCustom)
    }
  }, [])

  const setMode = useCallback((newMode: CatalogViewMode) => {
    setModeState(newMode)
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, newMode)
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newMode }))
      } catch {}
    }
  }, [])

  return [mode, setMode] as const
}
