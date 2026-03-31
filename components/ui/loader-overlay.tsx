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
        "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background/80 px-6 backdrop-blur-xl",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <style>{`
        @keyframes loader-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%);  }
        }
        @keyframes loader-orb {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%       { transform: scale(1.2); opacity: 1;   }
        }
      `}</style>

      {/* Pulsing orb behind the card */}
      <div
        className="pointer-events-none absolute h-96 w-96 rounded-full bg-primary/10 blur-[100px]"
        style={{ animation: "loader-orb 3s ease-in-out infinite" }}
      />

      {/* Glass card */}
      <div className="relative flex w-full max-w-[300px] flex-col items-center gap-5 overflow-hidden rounded-2xl border border-border/50 bg-background/60 px-8 py-8 shadow-2xl backdrop-blur-sm">

        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Logo */}
        <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`Logo ${companyName}`}
              width={72}
              height={72}
              className="h-full w-full object-contain p-2.5"
              unoptimized
              priority
            />
          ) : (
            <div className="h-full w-full animate-pulse rounded-2xl bg-muted/60" />
          )}
        </div>

        {/* Text */}
        <div className="w-full space-y-1 text-center">
          <p className="truncate text-sm font-semibold text-foreground">
            {isLoadingCompany && !company ? "Cargando empresa" : companyName}
          </p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>

        {/* Indeterminate progress bar */}
        <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-border/50">
          <div
            className="absolute inset-y-0 w-1/3 rounded-full bg-primary"
            style={{ animation: "loader-slide 1.5s cubic-bezier(0.4,0,0.6,1) infinite" }}
          />
        </div>

        {/* Bottom accent line */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </div>
    </div>
  )
}
