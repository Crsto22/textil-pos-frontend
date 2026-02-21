"use client"

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

interface AttributeSearchInputProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function AttributeSearchInput({
  placeholder,
  value,
  onChange,
}: AttributeSearchInputProps) {
  return (
    <div className="relative w-full">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border bg-background py-2 pl-10 pr-3 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
      />
    </div>
  )
}
