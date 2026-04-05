import {
  normalizeSupportedRole,
  roleHasAlmacenAccess,
  roleHasVentasAccess,
} from "@/lib/auth/roles"

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
}

export function hasAccess(
  role: string | undefined | null,
  pathname: string
): boolean {
  const normalizedRole = normalizeSupportedRole(role)
  if (!normalizedRole) return false

  if (normalizedRole === "ADMINISTRADOR") {
    return true
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
