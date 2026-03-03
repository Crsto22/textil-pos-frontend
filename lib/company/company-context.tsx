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

import type { Empresa, EmpresaPublica } from "@/lib/types/empresa"

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

function mapEmpresaPublicaToEmpresa(data: EmpresaPublica): Empresa {
  const normalizedLogo =
    typeof data.logoUrl === "string" ? data.logoUrl.trim() : ""

  return {
    idEmpresa: 0,
    nombre: data.nombre.trim(),
    ruc: "",
    razonSocial: "",
    correo: "",
    fechaCreacion: "",
    logoUrl: normalizedLogo ? normalizedLogo : undefined,
  }
}

function parseEmpresaPublica(data: unknown): Empresa | null {
  if (!data || typeof data !== "object") return null

  const payload = data as Partial<EmpresaPublica>
  const nombre =
    typeof payload.nombre === "string" ? payload.nombre.trim() : ""
  const logoUrl =
    typeof payload.logoUrl === "string" ? payload.logoUrl : undefined
  if (!nombre) return null

  return mapEmpresaPublicaToEmpresa({ nombre, logoUrl })
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

        setCompany(parseEmpresaPublica(data))
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
