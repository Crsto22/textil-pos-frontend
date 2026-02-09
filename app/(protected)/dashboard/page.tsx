"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, DollarSign, Users, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace("/")
  }

  // Datos de ejemplo para las estadísticas
  const stats = [
    {
      title: "Ventas Totales",
      value: "S/. 12,584.00",
      description: "+20.1% desde el mes pasado",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Productos",
      value: "248",
      description: "Total en inventario",
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Órdenes",
      value: "86",
      description: "+12 desde ayer",
      icon: ShoppingCart,
      color: "text-purple-600"
    },
    {
      title: "Clientes",
      value: "142",
      description: "+8 nuevos este mes",
      icon: Users,
      color: "text-orange-600"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bienvenido, {user?.nombre} {user?.apellido} — {user?.rol}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleLogout} title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Additional Content Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Resumen de Ventas</CardTitle>
              <CardDescription>
                Vista general del rendimiento de ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Gráfico de ventas (próximamente)
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimas transacciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Venta #{1000 + item}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Hace {item} hora{item > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="font-medium">
                      +S/. {(100 * 500 + 50).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
