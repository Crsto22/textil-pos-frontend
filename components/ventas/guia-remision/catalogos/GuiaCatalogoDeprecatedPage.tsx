import Link from "next/link"

interface GuiaCatalogoDeprecatedPageProps {
  title: string
}

export function GuiaCatalogoDeprecatedPage({
  title,
}: GuiaCatalogoDeprecatedPageProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Guia de remision
            </p>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Este catalogo ya no forma parte del flujo actual. Ahora los datos de
            conductores, transportistas y vehiculos se envian dentro del payload de
            la guia de remision remitente.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ventas/guia-remision/nueva"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Ir a nueva guia
            </Link>
            <Link
              href="/ventas/guia-remision"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
