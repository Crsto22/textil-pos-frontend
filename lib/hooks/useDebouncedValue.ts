"use client"

import { useEffect, useRef, useState } from "react"

export const SEARCH_DEBOUNCE_MS = 500

export function useDebouncedValue<T>(
  value: T,
  delay = SEARCH_DEBOUNCE_MS,
  onDebounced?: () => void
) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const debouncedValueRef = useRef(value)
  const onDebouncedRef = useRef(onDebounced)

  useEffect(() => {
    onDebouncedRef.current = onDebounced
  }, [onDebounced])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.is(debouncedValueRef.current, value)) return
      onDebouncedRef.current?.()
      debouncedValueRef.current = value
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [delay, value])

  return debouncedValue
}
