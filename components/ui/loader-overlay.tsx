"use client"

import Image from "next/image"

import { useCompany } from "@/lib/company/company-context"
import { getEmpresaDisplayName } from "@/lib/empresa"
import { cn } from "@/lib/utils"

interface LoaderOverlayProps {
  className?: string
  message?: string
}

export function LoaderOverlay({
  className,
  message = "Cargando...",
}: LoaderOverlayProps) {
  const { company, isLoadingCompany } = useCompany()
  const companyName = getEmpresaDisplayName(company)
  const logoUrl = company?.logoUrl?.trim() || null

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-black/60",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <style>{`
        @keyframes logo-beat {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
      `}</style>

      {/* Content */}
      <div className="flex flex-col items-center gap-5 px-10 py-9">

        {/* Spinner + Logo */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin dark:border-white/10 dark:border-t-blue-400" />

          {/* Logo */}
          <div
            className="flex h-16 w-16 items-center justify-center overflow-hidden"
            style={{ animation: "logo-beat 1.8s ease-in-out infinite" }}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`Logo ${companyName}`}
                width={64}
                height={64}
                className="h-full w-full object-contain p-2 rounded-2xl"
                unoptimized
                priority
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-white/20" />
            )}
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1 text-center">
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {isLoadingCompany && !company ? "Cargando empresa" : companyName}
          </p>
          <p className="text-xs text-gray-400 dark:text-white/40">{message}</p>
        </div>
      </div>
    </div>
  )
}
