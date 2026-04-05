import { type Dispatch, type SetStateAction } from "react"

import { PaginationResponsive } from "@/components/ui/pagination-responsive"

interface ColoresPaginationProps {
  totalElements: number
  totalPages: number
  page: number
  onPageChange: Dispatch<SetStateAction<number>>
}

export function ColoresPagination(props: ColoresPaginationProps) {
  return <PaginationResponsive {...props} itemLabel="colores" />
}
