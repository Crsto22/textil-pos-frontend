export function TallasTableSkeleton() {
  const rows = Array.from({ length: 6 }, (_, i) => i)

  return (
    <>
      {/* ─── MOBILE card skeletons ─── */}
      <div className="grid grid-cols-1 gap-2 sm:hidden">
        {rows.map((i) => (
          <div key={i} className="rounded-xl border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="mt-3 flex justify-end gap-1 border-t pt-2">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
              <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* ─── DESKTOP table skeleton ─── */}
      <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3"><div className="h-4 w-10 animate-pulse rounded bg-muted" /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  </div>
                </td>
                <td className="px-4 py-3"><div className="h-5 w-20 animate-pulse rounded-full bg-muted" /></td>
                <td className="px-4 py-3"><div className="ml-auto h-8 w-16 animate-pulse rounded bg-muted" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
