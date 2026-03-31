import { memo } from "react"
import { Building2, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface EmpresaEmptyStateProps {
    onRetry: () => void
}

function EmpresaEmptyStateComponent({ onRetry }: EmpresaEmptyStateProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <Building2 className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="mb-1 text-sm font-medium text-foreground">
                    Sin informacion de empresa
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                    No se encontro ninguna empresa registrada en el sistema.
                </p>
                <Button variant="outline" size="sm" onClick={onRetry}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reintentar
                </Button>
            </CardContent>
        </Card>
    )
}

export const EmpresaEmptyState = memo(EmpresaEmptyStateComponent)
