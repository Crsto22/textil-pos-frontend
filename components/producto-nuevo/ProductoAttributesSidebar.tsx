"use client"

import type { ComponentProps } from "react"

import { ProductoColorsCard } from "@/components/producto-nuevo/ProductoColorsCard"
import { ProductoTallasCard } from "@/components/producto-nuevo/ProductoTallasCard"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export type ProductoAttributeSidebarSection = "colors" | "tallas"

interface ProductoAttributesSidebarProps {
  open: boolean
  activeSection: ProductoAttributeSidebarSection
  selectedColorsCount: number
  selectedTallasCount: number
  onOpenChange: (open: boolean) => void
  onSectionChange: (section: ProductoAttributeSidebarSection) => void
  colorPanelProps: ComponentProps<typeof ProductoColorsCard>
  tallaPanelProps: ComponentProps<typeof ProductoTallasCard>
}

function SidebarSectionButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
        active
          ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-300"
          : "border-border bg-background hover:bg-muted/60"
      )}
      aria-pressed={active}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span
        className={cn(
          "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
          active
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
            : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  )
}

export function ProductoAttributesSidebar({
  open,
  activeSection,
  selectedColorsCount,
  selectedTallasCount,
  onOpenChange,
  onSectionChange,
  colorPanelProps,
  tallaPanelProps,
}: ProductoAttributesSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="h-dvh w-full max-w-full rounded-none p-0 sm:max-w-[560px]"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="space-y-2 border-b px-6 py-5">
            <SheetTitle className="text-2xl">Atributos del producto</SheetTitle>
            <SheetDescription>
              Selecciona colores y tallas para construir la lista completa de variantes
              que se registrara al guardar el producto.
            </SheetDescription>
          </SheetHeader>

          <div className="border-b px-6 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SidebarSectionButton
                active={activeSection === "colors"}
                label="Colores"
                count={selectedColorsCount}
                onClick={() => onSectionChange("colors")}
              />
              <SidebarSectionButton
                active={activeSection === "tallas"}
                label="Tallas"
                count={selectedTallasCount}
                onClick={() => onSectionChange("tallas")}
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-6 py-5">
            {activeSection === "colors" ? (
              <ProductoColorsCard {...colorPanelProps} />
            ) : (
              <ProductoTallasCard {...tallaPanelProps} />
            )}
          </div>

          <div className="border-t px-6 py-4 text-xs text-muted-foreground">
            Cada combinacion color/talla actualiza la matriz de variantes automaticamente.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
