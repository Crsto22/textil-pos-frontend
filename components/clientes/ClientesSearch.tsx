import { memo } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

interface ClientesSearchProps {
    search: string
    onSearchChange: (value: string) => void
}

function ClientesSearchComponent({ search, onSearchChange }: ClientesSearchProps) {
    return (
        <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
        </div>
    )
}

export const ClientesSearch = memo(ClientesSearchComponent)
