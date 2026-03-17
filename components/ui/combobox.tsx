"use client"

import { useMemo, useState } from "react"
import { CheckIcon, ChevronUpDownIcon, PlusIcon } from "@heroicons/react/24/outline"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  avatarText?: string
  avatarClassName?: string
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
  loadingMessage?: string
  disabled?: boolean
  onCreateAction?: (query: string) => void
  createActionLabel?: string
  createActionDisabled?: boolean
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
  loadingMessage = "Buscando...",
  disabled = false,
  onCreateAction,
  createActionLabel = "Nueva opcion",
  createActionDisabled = false,
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
          <span className="flex min-w-0 items-center gap-2">
            {selectedOption?.avatarText ? (
              <span
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase",
                  selectedOption.avatarClassName ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                {selectedOption.avatarText}
              </span>
            ) : null}
            <span
              className={cn(
                "truncate text-left",
                !selectedOption && "text-muted-foreground"
              )}
            >
              {selectedOption?.label ?? placeholder}
            </span>
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
          {onCreateAction ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (createActionDisabled) return
                  onCreateAction(searchValue)
                  setOpen(false)
                }}
                disabled={createActionDisabled}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm font-medium transition-colors",
                  createActionDisabled
                    ? "cursor-not-allowed text-muted-foreground opacity-60"
                    : "text-primary hover:bg-accent"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    createActionDisabled
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <PlusIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{createActionLabel}</span>
                </span>
              </button>

              <div className="my-1 border-t" />
            </>
          ) : null}

          {loading ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">{loadingMessage}</p>
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
                  {option.avatarText ? (
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase",
                        option.avatarClassName ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {option.avatarText}
                    </span>
                  ) : null}
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
