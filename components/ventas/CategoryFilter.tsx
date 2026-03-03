"use client"

import { useMemo } from "react"

interface ColorOption {
  name: string
  hex: string | null | undefined
}

interface CategoryFilterProps {
  categories: string[]
  colors: ColorOption[]
  activeCategory: string
  onCategoryChange: (cat: string) => void
  activeColor: string | null
  onColorChange: (color: string | null) => void
}

function normalizeHexColor(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed
  if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`
  return "#94a3b8"
}

export default function CategoryFilter({
  categories,
  colors,
  activeCategory,
  onCategoryChange,
  activeColor,
  onColorChange,
}: CategoryFilterProps) {
  const categoryOptions = useMemo(
    () => ["Todos", ...categories.filter((category) => category.trim() !== "")],
    [categories]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2 flex-1">
        {categoryOptions.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={[
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150",
              activeCategory === category
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700",
            ].join(" ")}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {colors.slice(0, 10).map((color) => (
          <button
            key={color.name}
            title={color.name}
            onClick={() => onColorChange(activeColor === color.name ? null : color.name)}
            className={[
              "h-6 w-6 rounded-full border-2 transition-all duration-150 shrink-0",
              activeColor === color.name
                ? "border-blue-500 scale-110 shadow-md"
                : "border-white dark:border-slate-800 hover:scale-110",
            ].join(" ")}
            style={{ backgroundColor: normalizeHexColor(color.hex) }}
          />
        ))}
      </div>
    </div>
  )
}
