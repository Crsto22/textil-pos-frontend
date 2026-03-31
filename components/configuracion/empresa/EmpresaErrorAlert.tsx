import { memo } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface EmpresaErrorAlertProps {
    message: string
    onRetry: () => void
}

function EmpresaErrorAlertComponent({
    message,
    onRetry,
}: EmpresaErrorAlertProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {message}
            </span>
            <Button
                variant="outline"
                size="xs"
                onClick={onRetry}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
                <RotateCcw className="h-3 w-3" />
                Reintentar
            </Button>
        </div>
    )
}

export const EmpresaErrorAlert = memo(EmpresaErrorAlertComponent)
