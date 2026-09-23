import { DataTable } from '../../../components/common/Tables'
import type { LeadRow } from '../types'
import { leadColumns } from '../utils/leadColumns'

type LeadsTableProps = {
  data: LeadRow[]
  loading?: boolean
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function LeadsTable({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: LeadsTableProps) {
  return (
    <DataTable
      loading={loading}
      data={data}
      columns={leadColumns}
      rowKey="id"
      isPaginate
      currentPage={page}
      setCurrentPage={onPageChange}
      limit={limit}
      setLimit={onLimitChange}
      total={total}
      showSizeChanger={total > 10}
    />
  )
}
