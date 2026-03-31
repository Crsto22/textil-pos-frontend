export function ComprobantesTableSkeleton({
  canManage,
}: {
  canManage: boolean
}) {
  return (
    <>
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
          <td className="hidden px-4 py-4 md:table-cell">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </td>
          <td className="hidden px-4 py-4 xl:table-cell">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
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
    </>
  )
}
