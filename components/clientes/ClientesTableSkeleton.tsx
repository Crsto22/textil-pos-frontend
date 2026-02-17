import { memo, useMemo } from "react"

interface ClientesTableSkeletonProps {
    rows?: number
}

function ClientesTableSkeletonComponent({ rows = 6 }: ClientesTableSkeletonProps) {
    const rowIndexes = useMemo(() => Array.from({ length: rows }, (_, index) => index), [rows])

    return (
        <>
            {rowIndexes.map((rowIndex) => (
                <tr key={rowIndex} className="border-b last:border-0">
                    <td className="px-4 py-3">
                        <div className="flex animate-pulse items-center gap-3">
                            <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
                            <div className="space-y-2">
                                <div className="h-3 w-36 rounded bg-muted" />
                                <div className="h-3 w-28 rounded bg-muted sm:hidden" />
                            </div>
                        </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                        <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="hidden px-4 py-3 xl:table-cell">
                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3 text-center">
                        <div className="mx-auto h-4 w-16 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3 text-center">
                        <div className="mx-auto h-8 w-8 animate-pulse rounded-lg bg-muted" />
                    </td>
                </tr>
            ))}
        </>
    )
}

export const ClientesTableSkeleton = memo(ClientesTableSkeletonComponent)
