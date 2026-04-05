import { type Dispatch, type SetStateAction } from "react"

import { PaginationResponsive } from "@/components/ui/pagination-responsive"

interface CategoriasPaginationProps {
  totalElements: number
  totalPages: number
  page: number
  onPageChange: Dispatch<SetStateAction<number>>
}

export function CategoriasPagination(props: CategoriasPaginationProps) {
  return <PaginationResponsive {...props} itemLabel="categorias" />
}
