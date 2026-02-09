"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GalleryVerticalEnd } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth/auth-context"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login } = useAuth()
  const router = useRouter()

  // Versión del sistema
  const systemVersion = "v1.0.0"

  // Array de imágenes para el carousel
  const carouselImages = [
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await login({ email, password })

    if (result.ok) {
      router.push("/dashboard")
    } else {
      setError(result.message ?? "Error al iniciar sesión")
    }

    setIsLoading(false)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Header with Logo and Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <h1 className="font-medium">Sistema POS Textil</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Form centered */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Inicia sesión en tu cuenta</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Ingresa tu email para acceder a tu cuenta
                </p>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              <div className="grid gap-6">
                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Contraseña</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Login button */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </div>

              {/* Version */}
              <div className="text-center text-xs text-muted-foreground">
                Versión {systemVersion}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right side - Carousel */}
      <div className="relative hidden lg:block overflow-hidden">
        <Carousel
          opts={{
            loop: true,
            align: "start",
          }}
          plugins={[
            Autoplay({
              delay: 3000,
              stopOnInteraction: false,
            }),
          ]}
          className="h-full w-full"
        >
          <CarouselContent className="h-screen">
            {carouselImages.map((image, index) => (
              <CarouselItem key={index} className="relative h-full">
                <Image
                  src={image}
                  alt={`Login background ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  unoptimized={image.startsWith('http')}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}
