import { memo } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

interface ClientesSearchProps {
    search: string
    onSearchChange: (value: string) => void
}

function ClientesSearchComponent({ search, onSearchChange }: ClientesSearchProps) {
    return (
        <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                placeholder="Buscar por nombre, documento o telefono..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
        </div>
    )
}

export const ClientesSearch = memo(ClientesSearchComponent)
