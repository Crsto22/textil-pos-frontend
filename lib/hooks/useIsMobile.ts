"use client"

import { useCallback, useSyncExternalStore } from "react"

export function useIsMobile(breakpoint = 640) {
  const subscribe = useCallback((onChange: () => void) => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [breakpoint])
  const getSnapshot = useCallback(
    () => window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches,
    [breakpoint]
  )
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
