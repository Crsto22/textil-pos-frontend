"use client"

import { useEffect, useState } from "react"

export const SEARCH_DEBOUNCE_MS = 500

export function useDebouncedValue<T>(
  value: T,
  delay = SEARCH_DEBOUNCE_MS,
  onDebounced?: () => void
) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onDebounced?.()
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [delay, onDebounced, value])

  return debouncedValue
}
