import { memo } from "react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ALL_CLIENTE_DOCUMENT_FILTER,
    isTipoDocumento,
    type ClienteTipoDocumentoFilter,
    TIPO_DOCUMENTO_OPTIONS,
} from "@/lib/types/cliente"

interface ClientesFiltersProps {
    tipoDocumentoFilter: ClienteTipoDocumentoFilter
    onTipoDocumentoFilterChange: (value: ClienteTipoDocumentoFilter) => void
}

function ClientesFiltersComponent({
    tipoDocumentoFilter,
    onTipoDocumentoFilterChange,
}: ClientesFiltersProps) {
    return (
        <div className="grid w-full gap-3 sm:w-auto">
            <Select
                value={tipoDocumentoFilter}
                onValueChange={(value) => {
                    if (value === ALL_CLIENTE_DOCUMENT_FILTER) {
                        onTipoDocumentoFilterChange(ALL_CLIENTE_DOCUMENT_FILTER)
                        return
                    }

                    if (isTipoDocumento(value)) {
                        onTipoDocumentoFilterChange(value)
                    }
                }}
            >
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm sm:min-w-52 dark:border-slate-700 dark:bg-slate-800">
                    <SelectValue placeholder="Filtrar por documento" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_CLIENTE_DOCUMENT_FILTER}>
                        Todos los documentos
                    </SelectItem>
                    {TIPO_DOCUMENTO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

export const ClientesFilters = memo(ClientesFiltersComponent)
