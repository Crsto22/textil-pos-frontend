"use client"

import { KimentsLogo } from "@/components/KimentsLogo"
import { cn } from "@/lib/utils"

interface LoaderOverlayProps {
  className?: string
}

export function LoaderOverlay({
  className,
}: LoaderOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-black/60",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <style>{`
        @keyframes lo-dot {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50%       { opacity: 1;    transform: scale(1.1); }
        }
      `}</style>

      <div className="flex flex-col items-center gap-6 px-10 py-9">
        <KimentsLogo size="lg" />

        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span
            className="block h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"
            style={{ animation: "lo-dot 1.2s ease-in-out infinite" }}
          />
          <span
            className="block h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"
            style={{ animation: "lo-dot 1.2s ease-in-out 0.2s infinite" }}
          />
          <span
            className="block h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"
            style={{ animation: "lo-dot 1.2s ease-in-out 0.4s infinite" }}
          />
        </div>
      </div>
    </div>
  )
}
