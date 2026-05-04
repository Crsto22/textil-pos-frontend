import { memo } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

interface TurnosSearchProps {
  search: string
  onSearchChange: (value: string) => void
}

function TurnosSearchComponent({ search, onSearchChange }: TurnosSearchProps) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar turno..."
        className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none"
      />
    </div>
  )
}

export const TurnosSearch = memo(TurnosSearchComponent)
