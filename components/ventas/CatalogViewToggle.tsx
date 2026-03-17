"use client"

import { QueueListIcon, Squares2X2Icon } from "@heroicons/react/24/outline"

import type { CatalogViewMode } from "@/lib/catalog-view"
import { cn } from "@/lib/utils"

interface CatalogViewToggleProps {
  value: CatalogViewMode
  onChange: (nextValue: CatalogViewMode) => void
}

const OPTIONS = [
  {
    value: "productos" as const,
    label: "Productos",
    Icon: Squares2X2Icon,
  },
  {
    value: "variantes" as const,
    label: "Variantes",
    Icon: QueueListIcon,
  },
]

export default function CatalogViewToggle({
  value,
  onChange,
}: CatalogViewToggleProps) {
  return (
    <div className="inline-flex h-[54px] items-center rounded-[26px] border border-slate-200 bg-slate-50/90 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      {OPTIONS.map((option) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-label={`Cambiar vista a ${option.label.toLowerCase()}`}
            title={option.label}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-[22px] transition-all duration-200",
              active
                ? "bg-white text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.12)] dark:bg-slate-800 dark:text-slate-50"
                : "text-slate-400 hover:bg-white hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            )}
          >
            <option.Icon className="h-5 w-5" />
            <span className="sr-only">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
