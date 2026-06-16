"use client"

import { KimentsLogo } from "@/components/KimentsLogo"
import { cn } from "@/lib/utils"

type SpinnerSize = "xs" | "sm" | "md" | "lg"

const SIZE: Record<SpinnerSize, { dot: string; gap: string }> = {
  xs: { dot: "h-1.5 w-1.5", gap: "gap-1" },
  sm: { dot: "h-2 w-2",     gap: "gap-1" },
  md: { dot: "h-2.5 w-2.5", gap: "gap-1.5" },
  lg: { dot: "h-3 w-3",     gap: "gap-1.5" },
}

interface LoaderSpinnerProps {
  size?: SpinnerSize
  text?: string
  className?: string
}

export function LoaderSpinner({ size = "md", className, text: _text }: LoaderSpinnerProps) {
  const cfg = SIZE[size]

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <style>{`
        @keyframes ls-dot {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50%       { opacity: 1;    transform: scale(1.1); }
        }
      `}</style>

      <KimentsLogo size="sm" />

      <div className={cn("flex items-center", cfg.gap)} aria-hidden="true">
        <span
          className={cn("block rounded-full bg-blue-500 dark:bg-blue-400", cfg.dot)}
          style={{ animation: "ls-dot 1.2s ease-in-out infinite" }}
        />
        <span
          className={cn("block rounded-full bg-blue-500 dark:bg-blue-400", cfg.dot)}
          style={{ animation: "ls-dot 1.2s ease-in-out 0.2s infinite" }}
        />
        <span
          className={cn("block rounded-full bg-blue-500 dark:bg-blue-400", cfg.dot)}
          style={{ animation: "ls-dot 1.2s ease-in-out 0.4s infinite" }}
        />
      </div>
    </div>
  )
}
