import { memo } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { Input } from "@/components/ui/input"

interface PagosSearchProps {
  search: string
  onSearchChange: (value: string) => void
}

function PagosSearchComponent({ search, onSearchChange }: PagosSearchProps) {
  return (
    <div className="relative w-full">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por cliente, venta, metodo o codigo..."
        className="h-10 pl-10"
      />
    </div>
  )
}

export const PagosSearch = memo(PagosSearchComponent)
