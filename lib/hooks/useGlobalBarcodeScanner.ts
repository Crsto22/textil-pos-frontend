import { useCallback, useEffect, useRef, useState } from "react"

const CHAR_INTERVAL_THRESHOLD = 50
const MIN_BARCODE_LENGTH = 4

interface UseGlobalBarcodeScannerOptions {
  onScan: (barcode: string) => void
}

export function useGlobalBarcodeScanner({ onScan }: UseGlobalBarcodeScannerOptions) {
  const [active, setActive] = useState(false)
  const bufferRef = useRef("")
  const lastKeyTimeRef = useRef(0)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  const toggle = useCallback(() => {
    setActive((prev) => !prev)
  }, [])

  useEffect(() => {
    if (!active) {
      bufferRef.current = ""
      lastKeyTimeRef.current = 0
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTextarea = target?.tagName === "TEXTAREA"
      const isContentEditable = target?.isContentEditable === true

      if (isTextarea || isContentEditable) return

      const now = Date.now()
      const elapsed = now - lastKeyTimeRef.current

      if (event.key === "Enter") {
        event.preventDefault()
        const barcode = bufferRef.current.trim()
        bufferRef.current = ""
        lastKeyTimeRef.current = 0

        if (barcode.length >= MIN_BARCODE_LENGTH) {
          onScanRef.current(barcode)
        }
        return
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        if (elapsed > CHAR_INTERVAL_THRESHOLD && bufferRef.current.length > 0) {
          bufferRef.current = ""
        }

        bufferRef.current += event.key
        lastKeyTimeRef.current = now

        const isInput = target?.tagName === "INPUT"
        if (isInput) {
          event.preventDefault()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      bufferRef.current = ""
      lastKeyTimeRef.current = 0
    }
  }, [active])

  return { active, toggle }
}
