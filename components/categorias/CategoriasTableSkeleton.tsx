export function CategoriasTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, index) => (
        <tr key={index} className="border-b last:border-0">
          <td className="px-4 py-3">
            <div className="h-4 w-10 animate-pulse rounded bg-muted" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          </td>
          <td className="hidden px-4 py-3 lg:table-cell">
            <div className="h-4 w-44 animate-pulse rounded bg-muted" />
          </td>
          <td className="hidden px-4 py-3 xl:table-cell">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
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
