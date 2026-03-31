"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"

interface CategoryOption {
  id: number
  name: string
}
interface ColorOption {
  id: number
  name: string
  hex: string | null | undefined
}

interface CategoryFilterProps {
  categories: CategoryOption[]
  colors: ColorOption[]
  activeCategoryId: number | null
  onCategoryChange: (idCategoria: number | null) => void
  categoryPage: number
  categoryTotalPages: number
  onCategoryNextPage: () => void
  onCategoryPrevPage: () => void
  activeColorId: number | null
  onColorChange: (idColor: number | null) => void
  colorPage: number
  colorTotalPages: number
  onColorNextPage: () => void
  onColorPrevPage: () => void
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
  activeCategoryId,
  onCategoryChange,
  categoryPage,
  categoryTotalPages,
  onCategoryNextPage,
  onCategoryPrevPage,
  activeColorId,
  onColorChange,
  colorPage,
  colorTotalPages,
  onColorNextPage,
  onColorPrevPage,
}: CategoryFilterProps) {
  const safeCategoryPage = Math.max(0, categoryPage)
  const safeTotalCategoryPages = Math.max(1, categoryTotalPages)
  const hasCategoryPagination = safeTotalCategoryPages > 1
  const canGoPrevCategoryPage = safeCategoryPage > 0
  const canGoNextCategoryPage = safeCategoryPage < safeTotalCategoryPages - 1

  const safeColorPage = Math.max(0, colorPage)
  const safeTotalColorPages = Math.max(1, colorTotalPages)
  const hasColorPagination = safeTotalColorPages > 1
  const canGoPrevColorPage = safeColorPage > 0
  const canGoNextColorPage = safeColorPage < safeTotalColorPages - 1

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <button
          onClick={() => onCategoryChange(null)}
          className={[
            "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150",
            activeCategoryId === null
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700",
          ].join(" ")}
        >
          Todos
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={[
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150",
              activeCategoryId === category.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700",
            ].join(" ")}
          >
            {category.name}
          </button>
        ))}

        {hasCategoryPagination && (
          <div className="ml-1 flex items-center gap-1.5">
            <button
              onClick={onCategoryPrevPage}
              disabled={!canGoPrevCategoryPage}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Categorias anteriores"
              aria-label="Categorias anteriores"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {safeCategoryPage + 1}/{safeTotalCategoryPages}
            </span>

            <button
              onClick={onCategoryNextPage}
              disabled={!canGoNextCategoryPage}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Siguientes categorias"
              aria-label="Siguientes categorias"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onColorChange(null)}
          className={[
            "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-150",
            activeColorId === null
              ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
          ].join(" ")}
        >
          Todos colores
        </button>

        {colors.map((color) => (
          <button
            key={color.id}
            title={color.name}
            onClick={() =>
              onColorChange(activeColorId === color.id ? null : color.id)
            }
            className={[
              "h-6 w-6 rounded-full border-2 transition-all duration-150 shrink-0",
              activeColorId === color.id
                ? "border-blue-500 scale-110 shadow-md"
                : "border-white dark:border-slate-800 hover:scale-110",
            ].join(" ")}
            style={{ backgroundColor: normalizeHexColor(color.hex) }}
          />
        ))}

        {hasColorPagination && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onColorPrevPage}
              disabled={!canGoPrevColorPage}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Colores anteriores"
              aria-label="Colores anteriores"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {safeColorPage + 1}/{safeTotalColorPages}
            </span>

            <button
              onClick={onColorNextPage}
              disabled={!canGoNextColorPage}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Siguientes colores"
              aria-label="Siguientes colores"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
