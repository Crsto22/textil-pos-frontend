"use client"

import { useMemo, useState } from "react"
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

interface ComboboxProps {
  id?: string
  value: string
  options: ComboboxOption[]
  searchValue: string
  onSearchValueChange: (value: string) => void
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loading?: boolean
  disabled?: boolean
}

export function Combobox({
  id,
  value,
  options,
  searchValue,
  onSearchValueChange,
  onValueChange,
  placeholder = "Seleccionar opcion...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  loading = false,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span
            className={cn(
              "truncate text-left",
              !selectedOption && "text-muted-foreground"
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
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
            <p className="px-2 py-2 text-sm text-muted-foreground">Buscando sucursales...</p>
          ) : options.length === 0 ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                >
                  <CheckIcon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
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
  )
}
