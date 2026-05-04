"use client"

import { useState } from "react"
import { BuildingStorefrontIcon, GlobeAltIcon, PlusIcon } from "@heroicons/react/24/outline"

import { OfertaBuilderSection } from "@/components/productos/ofertas/OfertaBuilderSection"
import { OfertasRegistradasSection } from "@/components/productos/ofertas/OfertasRegistradasSection"
import { OfertasSucursalSection } from "@/components/productos/ofertas/OfertasSucursalSection"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ProductosOfertasPage() {
  const [refreshToken, setRefreshToken] = useState(0)
  const [activeTab, setActiveTab] = useState("crear")

  function handleOfferSaved(tipo: "GLOBAL" | "SUCURSAL") {
    setRefreshToken((prev) => prev + 1)
    setActiveTab(tipo === "GLOBAL" ? "globales" : "sucursal")
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full max-w-xl overflow-x-auto">
          <TabsTrigger value="crear" className="flex-1 gap-2">
            <PlusIcon className="h-4 w-4" />
            Crear ofertas
          </TabsTrigger>
          <TabsTrigger value="globales" className="flex-1 gap-2">
            <GlobeAltIcon className="h-4 w-4" />
            Globales
          </TabsTrigger>
          <TabsTrigger value="sucursal" className="flex-1 gap-2">
            <BuildingStorefrontIcon className="h-4 w-4" />
            Por sucursal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crear">
          <OfertaBuilderSection onOfferSaved={handleOfferSaved} />
        </TabsContent>

        <TabsContent value="globales">
          <OfertasRegistradasSection refreshToken={refreshToken} />
        </TabsContent>

        <TabsContent value="sucursal">
          <OfertasSucursalSection refreshToken={refreshToken} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
