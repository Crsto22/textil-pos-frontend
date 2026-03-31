import { memo, type RefObject } from "react"
import Image from "next/image"
import { Building2, ImageIcon, Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface EmpresaLogoCardProps {
    logoPreview: string | null
    isUploading: boolean
    fileInputRef: RefObject<HTMLInputElement | null>
    onUpload: (file: File) => void
}

function EmpresaLogoCardComponent({
    logoPreview,
    isUploading,
    fileInputRef,
    onUpload,
}: EmpresaLogoCardProps) {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) void onUpload(file)
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        const file = event.dataTransfer.files?.[0]
        if (file) void onUpload(file)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                        <ImageIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Logo de la empresa
                </CardTitle>
                <CardDescription className="text-xs">
                    Se muestra en comprobantes, tickets y facturacion
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                />

                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") fileInputRef.current?.click()
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    className="group relative flex h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 text-center outline-none transition-all hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {isUploading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/80 backdrop-blur-sm">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-xs font-medium text-primary">
                                Subiendo logo...
                            </p>
                        </div>
                    )}

                    {logoPreview && !isUploading ? (
                        <Image
                            src={logoPreview}
                            alt="Logo de empresa"
                            width={160}
                            height={160}
                            className="h-40 w-40 rounded-lg object-contain"
                            unoptimized
                        />
                    ) : (
                        !isUploading && (
                            <>
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
                                    <Building2 className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground group-hover:text-primary">
                                        Arrastra tu logo aqui o haz clic
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                                        PNG, JPG o WEBP · max. 2 MB
                                    </p>
                                </div>
                            </>
                        )
                    )}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Subiendo...
                        </>
                    ) : (
                        <>
                            <Upload className="h-3.5 w-3.5" />
                            {logoPreview ? "Cambiar logo" : "Subir logo"}
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}

export const EmpresaLogoCard = memo(EmpresaLogoCardComponent)
