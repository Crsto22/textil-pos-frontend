"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type { Empresa, EmpresaPublica } from "@/lib/types/empresa"

type CompanyRecord = Empresa | EmpresaPublica

interface CompanyContextType {
  company: CompanyRecord | null
  isLoadingCompany: boolean
  companyError: string | null
  refreshCompany: () => Promise<void>
  setCompany: (company: CompanyRecord | null) => void
}

const CompanyContext = createContext<CompanyContextType | null>(null)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanyRecord | null>(null)
  const [companyError, setCompanyError] = useState<string | null>(null)
  const isLoadingCompany = false

  const refreshCompany = useCallback(async () => {
    setCompanyError(null)
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
