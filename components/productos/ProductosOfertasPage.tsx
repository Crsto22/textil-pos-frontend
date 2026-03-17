"use client"

import { useState } from "react"
import { PlusIcon, TagIcon } from "@heroicons/react/24/outline"

import { OfertaBuilderSection } from "@/components/productos/ofertas/OfertaBuilderSection"
import { OfertasRegistradasSection } from "@/components/productos/ofertas/OfertasRegistradasSection"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ProductosOfertasPage() {
  const [refreshToken, setRefreshToken] = useState(0)
  const [activeTab, setActiveTab] = useState("crear")

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="crear" className="flex-1 gap-2">
            <PlusIcon className="h-4 w-4" />
            Crear ofertas
          </TabsTrigger>
          <TabsTrigger value="registradas" className="flex-1 gap-2">
            <TagIcon className="h-4 w-4" />
            Ofertas registradas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crear">
          <OfertaBuilderSection
            onOfferSaved={() => {
              setRefreshToken((previous) => previous + 1)
            }}
          />
        </TabsContent>

        <TabsContent value="registradas">
          <OfertasRegistradasSection refreshToken={refreshToken} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
