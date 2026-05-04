"use client"

import Image from "next/image"
import { useCompany } from "@/lib/company/company-context"
import { cn } from "@/lib/utils"

type SpinnerSize = "xs" | "sm" | "md" | "lg"

const SIZE = {
  xs: { wrap: "h-5 w-5",  logo: "h-3 w-3",  ring: "border-2",    text: "text-xs" },
  sm: { wrap: "h-8 w-8",  logo: "h-5 w-5",  ring: "border-2",    text: "text-xs" },
  md: { wrap: "h-12 w-12",logo: "h-7 w-7",  ring: "border-[3px]",text: "text-sm" },
  lg: { wrap: "h-16 w-16",logo: "h-10 w-10",ring: "border-[3px]",text: "text-sm" },
} as const

interface LoaderSpinnerProps {
  size?: SpinnerSize
  text?: string
  className?: string
}

export function LoaderSpinner({ size = "md", text = "Cargando...", className }: LoaderSpinnerProps) {
  const { company } = useCompany()
  const logoUrl = company?.logoUrl?.trim() || null
  const cfg = SIZE[size]

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <style>{`
        @keyframes ls-spin  { to { transform: rotate(360deg); } }
        @keyframes ls-pulse { 0%,100%{ transform:scale(1);opacity:1; } 50%{ transform:scale(1.14);opacity:.8; } }
      `}</style>

      {/* Ring + Logo */}
      <div className={cn("relative flex items-center justify-center", cfg.wrap)}>
        <div
          className={cn(
            "absolute inset-0 rounded-full border-gray-200 border-t-blue-500 dark:border-white/10 dark:border-t-blue-400",
            cfg.ring
          )}
          style={{ animation: "ls-spin 0.9s linear infinite", borderStyle: "solid" }}
        />
        <div
          className={cn("flex items-center justify-center overflow-hidden rounded-md", cfg.logo)}
          style={{ animation: "ls-pulse 1.6s ease-in-out infinite" }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Cargando"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <div className="h-full w-full rounded bg-blue-500/20 dark:bg-blue-400/20" />
          )}
        </div>
      </div>

      {text && (
        <span className={cn("text-muted-foreground", cfg.text)}>{text}</span>
      )}
    </div>
  )
}
