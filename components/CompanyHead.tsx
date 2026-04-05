"use client"

import { useEffect } from "react"
import { useCompany } from "@/lib/company/company-context"
import { getEmpresaDisplayName } from "@/lib/empresa"

export function CompanyHead() {
  const { company } = useCompany()

  useEffect(() => {
    const name = getEmpresaDisplayName(company)
    document.title = name
  }, [company])

  useEffect(() => {
    if (!company?.logoUrl) return

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = document.createElement("link")
      link.rel = "icon"
      document.head.appendChild(link)
    }
    link.href = company.logoUrl
  }, [company?.logoUrl])

  return null
}
