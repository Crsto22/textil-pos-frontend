"use client"

import { useMemo, useState } from "react"
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/24/outline"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { ComboboxOption } from "@/components/ui/combobox"

interface SucursalMultiSelectProps {
  options: ComboboxOption[]
  selectedIds: number[]
  onSelectionChange: (ids: number[]) => void
  searchValue: string
  onSearchValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loading?: boolean
  loadingMessage?: string
  disabled?: boolean
  className?: string
  excludeIds?: number[]
}

export function SucursalMultiSelect({
  options,
  selectedIds,
  onSelectionChange,
  searchValue,
  onSearchValueChange,
  placeholder = "Seleccionar sucursales...",
  searchPlaceholder = "Buscar sucursal...",
  emptyMessage = "No se encontraron sucursales",
  loading = false,
  loadingMessage = "Buscando...",
  disabled = false,
  className,
  excludeIds = [],
}: SucursalMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const filteredOptions = useMemo(
    () => options.filter((option) => !excludeIds.includes(Number(option.value))),
    [options, excludeIds]
  )

  const selectedOptions = useMemo(
    () => filteredOptions.filter((option) => selectedIds.includes(Number(option.value))),
    [filteredOptions, selectedIds]
  )

  const handleToggle = (value: string) => {
    const id = Number(value)
    if (!Number.isInteger(id) || id <= 0) return

    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id]

    onSelectionChange(newIds)
  }

  const handleRemove = (id: number) => {
    onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id))
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            <span className="min-w-0 truncate text-left">
              {selectedOptions.length > 0
                ? `${selectedOptions.length} sucursal${selectedOptions.length > 1 ? "es" : ""} seleccionada${selectedOptions.length > 1 ? "s" : ""}`
                : placeholder}
            </span>
            <ChevronUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <div className="border-b p-2">
            <Input
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {loading ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">{loadingMessage}</p>
            ) : filteredOptions.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedIds.includes(Number(option.value))
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground"
                    )}
                  >
                    <CheckIcon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="truncate max-w-[140px]">{option.label}</span>
              <button
                type="button"
                onClick={() => handleRemove(Number(option.value))}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <XMarkIcon className="h-3 w-3" />
                <span className="sr-only">Eliminar {option.label}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
