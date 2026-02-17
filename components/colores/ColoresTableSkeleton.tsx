export function ColoresTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, index) => (
        <tr key={index} className="border-b last:border-0">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="ml-auto h-8 w-16 animate-pulse rounded bg-muted" />
          </td>
        </tr>
      ))}
    </>
  )
}
