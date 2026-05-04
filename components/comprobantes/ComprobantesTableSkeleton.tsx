export function ComprobantesTableSkeleton({
  canManage,
}: {
  canManage: boolean
}) {
  return (
    <>
      {/* ─── MOBILE skeleton ─── */}
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="h-3 w-40 animate-pulse rounded bg-muted" />
              {canManage && <div className="h-7 w-16 animate-pulse rounded-lg bg-muted" />}
            </div>
          </div>
        ))}
      </div>

      {/* ─── DESKTOP skeleton ─── */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full text-sm">
          <tbody>
            {Array.from({ length: 5 }, (_, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="px-4 py-4">
                  <div className="h-4 w-10 animate-pulse rounded bg-muted" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                    <div className="space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                </td>
                {canManage ? (
                  <td className="px-4 py-4">
                    <div className="ml-auto h-8 w-16 animate-pulse rounded bg-muted" />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
