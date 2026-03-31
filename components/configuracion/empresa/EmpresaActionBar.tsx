import { memo } from "react"
import { Loader2, RotateCcw, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface EmpresaActionBarProps {
    hasChanges: boolean
    isSaving: boolean
    onSave: () => void
    onReset: () => void
}

function EmpresaActionBarComponent({
    hasChanges,
    isSaving,
    onSave,
    onReset,
}: EmpresaActionBarProps) {
    return (
        <Card className="flex-row items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
                {hasChanges ? (
                    <>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            Cambios sin guardar
                        </span>
                    </>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        Sin cambios pendientes
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {hasChanges && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        disabled={isSaving}
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Descartar
                    </Button>
                )}

                <Button
                    type="button"
                    size="sm"
                    onClick={onSave}
                    disabled={isSaving || !hasChanges}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="h-3.5 w-3.5" />
                            Guardar cambios
                        </>
                    )}
                </Button>
            </div>
        </Card>
    )
}

export const EmpresaActionBar = memo(EmpresaActionBarComponent)
