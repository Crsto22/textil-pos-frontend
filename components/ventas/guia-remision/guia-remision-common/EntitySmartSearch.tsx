"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowPathIcon, MagnifyingGlassIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from "@/lib/hooks/useDebouncedValue"

// ─── Types ─────────────────────────────────────────────────────────────────────

export type EntitySearchResult<T = Record<string, unknown>> = {
  id: string | number
  label: string
  subtitle?: string
  data: T
}

export type EntitySmartSearchProps<T = Record<string, unknown>> = {
  label: string
  placeholder?: string
  searchEndpoint: string
  searchParamKey?: string
  parseResult: (item: unknown) => EntitySearchResult<T> | null
  onSelect: (result: EntitySearchResult<T>) => void
  onAddNew?: () => void
  selectedItems?: EntitySearchResult<T>[]
  onRemoveItem?: (id: string | number) => void
  disabled?: boolean
  /** Cuando es true, lista los disponibles al hacer click en el input (sin necesidad de escribir) */
  eagerLoad?: boolean
}

// ─── Helper functions ──────────────────────────────────────────────────────────

function parseJsonSafe(response: Response) {
  return response.json().catch(() => null)
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function EntitySmartSearch<T = Record<string, unknown>>({
  label,
  placeholder = "Buscar...",
  searchEndpoint,
  searchParamKey = "q",
  parseResult,
  onSelect,
  onAddNew,
  selectedItems = [],
  onRemoveItem,
  disabled = false,
  eagerLoad = false,
}: EntitySmartSearchProps<T>) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<EntitySearchResult<T>[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  // Incrementar para disparar una carga eager al enfocar el input
  const [eagerTrigger, setEagerTrigger] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    const query = debouncedSearch.trim()
    const shouldFetch = query.length > 0 || (eagerLoad && eagerTrigger > 0)

    if (!shouldFetch) {
      setResults([])
      setShowDropdown(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const fetchResults = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          [searchParamKey]: query,
          page: "0",
        })
        const response = await authFetch(
          `${searchEndpoint}?${params.toString()}`,
          { signal: controller.signal }
        )
        const data = await parseJsonSafe(response)
        if (controller.signal.aborted) return

        if (response.ok) {
          const items = data?.content ?? data?.data ?? data ?? []
          const parsed = Array.isArray(items)
            ? items.map(parseResult).filter((item): item is EntitySearchResult<T> => item !== null)
            : []
          setResults(parsed)
          setShowDropdown(true)
        } else {
          setResults([])
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void fetchResults()
  }, [debouncedSearch, eagerTrigger, eagerLoad, searchEndpoint, searchParamKey, parseResult])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const handleSelect = useCallback(
    (result: EntitySearchResult<T>) => {
      onSelect(result)
      setSearch("")
      setResults([])
      setShowDropdown(false)
    },
    [onSelect]
  )

  const handleFocus = () => {
    if (eagerLoad) {
      // Incrementar el trigger para disparar fetch aunque el query esté vacío
      setEagerTrigger((k) => k + 1)
    }
    if (results.length > 0) setShowDropdown(true)
  }

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 150)
  }

  const filteredResults = selectedItems.length > 0
    ? results.filter(
        (result) => !selectedItems.some((item) => item.id === result.id)
      )
    : results

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {label}
        </label>
        {onAddNew && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddNew}
            disabled={disabled}
            className="h-7 gap-1.5 text-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Nuevo
          </Button>
        )}
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        {loading && (
          <ArrowPathIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-10 pl-9 pr-9"
        />

        {/* Dropdown */}
        {showDropdown && !loading && filteredResults.length === 0 && (debouncedSearch.trim() || eagerTrigger > 0) && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            Sin resultados
          </div>
        )}

        {showDropdown && filteredResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="max-h-60 overflow-y-auto">
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelect(result)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{result.label}</p>
                    {result.subtitle && (
                      <p className="truncate text-xs text-slate-500">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected items list */}
      {selectedItems.length > 0 && (
        <div className="space-y-2">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.label}</p>
                {item.subtitle && (
                  <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                )}
              </div>
              {onRemoveItem && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  title="Eliminar"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
