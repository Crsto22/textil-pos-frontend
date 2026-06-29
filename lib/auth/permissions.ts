import {
  normalizeSupportedRole,
  roleHasAlmacenAccess,
  roleHasVentasAccess,
} from "@/lib/auth/roles"

const GUIA_ROUTES = [
  "/ventas/guia-remision",
]

const PEDIDOS_ROUTES = [
  "/ventas/pedidos",
]

const ADMIN_ONLY_ROUTES = [
  "/configuracion/ecommerce",
]

interface RoleConfig {
  allowedRoutes: string[]
  defaultRoute: string
}

const SALES_ROUTES = [
  "/dashboard",
  "/ventas",
  "/clientes",
  "/configuracion/cuenta",
  "/configuracion/comprobantes",
]

const WAREHOUSE_ROUTES = [
  "/dashboard",
  "/productos",
  "/stock",
  "/reportes/productos",
  "/configuracion/cuenta",
]

const SALES_AND_WAREHOUSE_ROUTES = Array.from(
  new Set([...SALES_ROUTES, ...WAREHOUSE_ROUTES])
)

export const ROLE_CONFIG: Record<string, RoleConfig> = {
  VENTAS: {
    allowedRoutes: SALES_ROUTES,
    defaultRoute: "/dashboard",
  },
  VENTAS_ALMACEN: {
    allowedRoutes: SALES_AND_WAREHOUSE_ROUTES,
    defaultRoute: "/dashboard",
  },
  VENDEDOR: {
    allowedRoutes: SALES_ROUTES,
    defaultRoute: "/dashboard",
  },
  ALMACEN: {
    allowedRoutes: WAREHOUSE_ROUTES,
    defaultRoute: "/dashboard",
  },
  ADMINISTRADOR: {
    allowedRoutes: ["*"],
    defaultRoute: "/dashboard",
  },
  SISTEMA: {
    allowedRoutes: ["*"],
    defaultRoute: "/dashboard",
  },
}

export function hasAccess(
  role: string | undefined | null,
  pathname: string,
  puedeAceptarPedidos = false
): boolean {
  const normalizedRole = normalizeSupportedRole(role)
  if (!normalizedRole) return false

  if (normalizedRole === "ADMINISTRADOR" || normalizedRole === "SISTEMA") {
    return true
  }

  // Guías de remisión: solo ALMACEN y VENTAS_ALMACEN (no VENTAS)
  const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  if (isAdminOnlyRoute) {
    return false
  }

  const isPedidosRoute = PEDIDOS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  if (isPedidosRoute) {
    return roleHasVentasAccess(normalizedRole) && puedeAceptarPedidos
  }

  const isGuiaRoute = GUIA_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  if (isGuiaRoute) {
    return roleHasAlmacenAccess(normalizedRole)
  }

  const isVentasRoute = SALES_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  const isWarehouseRoute = WAREHOUSE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isVentasRoute || isWarehouseRoute) {
    return (
      (isVentasRoute && roleHasVentasAccess(normalizedRole)) ||
      (isWarehouseRoute && roleHasAlmacenAccess(normalizedRole))
    )
  }

  const config = ROLE_CONFIG[normalizedRole]
  if (!config) return false
  if (config.allowedRoutes.includes("*")) return true

  return config.allowedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function getDefaultRoute(role: string | undefined | null): string {
  const normalizedRole = normalizeSupportedRole(role)
  if (!normalizedRole) return "/"

  return ROLE_CONFIG[normalizedRole]?.defaultRoute || "/"
}
