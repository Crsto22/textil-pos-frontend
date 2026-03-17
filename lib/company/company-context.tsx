"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { normalizeEmpresaPublica } from "@/lib/empresa"
import type { Empresa } from "@/lib/types/empresa"

interface CompanyContextType {
  company: Empresa | null
  isLoadingCompany: boolean
  companyError: string | null
  refreshCompany: () => Promise<void>
  setCompany: (company: Empresa | null) => void
}

const CompanyContext = createContext<CompanyContextType | null>(null)

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Empresa | null>(null)
  const [isLoadingCompany, setIsLoadingCompany] = useState(false)
  const [companyError, setCompanyError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const loadCompany = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoadingCompany(true)
      setCompanyError(null)

      try {
        const response = await fetch("/api/empresa/publico", {
          signal,
          cache: "no-store",
        })
        const data = await parseJsonSafe(response)
        if (signal?.aborted) return

        if (!response.ok) {
          setCompany(null)
          setCompanyError(
            data?.message ?? "Error al obtener la informacion de la empresa"
          )
          return
        }

        setCompany(normalizeEmpresaPublica(data))
      } catch (requestError) {
        if (isAbortError(requestError)) return
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Error inesperado al obtener la empresa"
        setCompany(null)
        setCompanyError(message)
      } finally {
        if (!signal?.aborted) {
          setIsLoadingCompany(false)
        }
      }
    },
    []
  )

  const refreshCompany = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    await loadCompany(controller.signal)
  }, [loadCompany])

  useEffect(() => {
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller
    void loadCompany(controller.signal)

    return () => controller.abort()
  }, [loadCompany])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const value = useMemo(
    () => ({
      company,
      isLoadingCompany,
      companyError,
      refreshCompany,
      setCompany,
    }),
    [company, isLoadingCompany, companyError, refreshCompany]
  )

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error("useCompany debe usarse dentro de un <CompanyProvider>")
  }
  return context
}
