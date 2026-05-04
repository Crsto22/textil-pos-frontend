import { memo } from "react"
import { PaginationResponsive } from "@/components/ui/pagination-responsive"

interface TurnosPaginationProps {
  totalElements: number
  totalPages: number
  page: number
  onPageChange: (page: number) => void
}

function TurnosPaginationComponent({
  totalElements,
  totalPages,
  page,
  onPageChange,
}: TurnosPaginationProps) {
  return (
    <PaginationResponsive
      totalElements={totalElements}
      totalPages={totalPages}
      page={page}
      onPageChange={onPageChange}
    />
  )
}

export const TurnosPagination = memo(TurnosPaginationComponent)
