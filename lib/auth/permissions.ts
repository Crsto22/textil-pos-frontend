export const ROLE_CONFIG: Record<string, { allowedRoutes: string[]; defaultRoute: string }> = {
  VENTAS: {
    allowedRoutes: [
      "/dashboard",
      "/ventas",
      "/clientes",
      "/configuracion/cuenta",
      "/configuracion/comprobantes",
    ],
    defaultRoute: "/dashboard",
  },
  VENDEDOR: {
    allowedRoutes: [
      "/dashboard",
      "/ventas",
      "/clientes",
      "/configuracion/cuenta",
      "/configuracion/comprobantes",
    ],
    defaultRoute: "/dashboard",
  },
  ALMACEN: {
    allowedRoutes: [
      "/dashboard",
      "/productos",
      "/stock",
      "/reportes/productos",
      "/configuracion/cuenta",
    ],
    defaultRoute: "/dashboard",
  },
  ADMINISTRADOR: {
    allowedRoutes: ["*"],
    defaultRoute: "/dashboard",
  },
}

export function hasAccess(role: string | undefined | null, pathname: string): boolean {
  if (!role) return false
  
  const formattedRole = role.toUpperCase()
  const config = ROLE_CONFIG[formattedRole]
  
  if (!config) return false
  if (config.allowedRoutes.includes("*")) return true

  // Verifica si la ruta actual coincide con alguna de las permitidas o sus subrutas
  return config.allowedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function getDefaultRoute(role: string | undefined | null): string {
  if (!role) return "/"
  const formattedRole = role.toUpperCase()
  return ROLE_CONFIG[formattedRole]?.defaultRoute || "/"
}
