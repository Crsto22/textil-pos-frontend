import { type Dispatch, type SetStateAction } from "react"

import { PaginationResponsive } from "@/components/ui/pagination-responsive"

interface TallasPaginationProps {
  totalElements: number
  totalPages: number
  page: number
  onPageChange: Dispatch<SetStateAction<number>>
}

export function TallasPagination(props: TallasPaginationProps) {
  return <PaginationResponsive {...props} itemLabel="tallas" />
}
