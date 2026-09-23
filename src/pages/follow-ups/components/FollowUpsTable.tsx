import { DataTable } from '../../../components/common/Tables'
import type { FollowUpRow } from '../types'
import { followUpColumns } from '../utils/followUpColumns'

type FollowUpsTableProps = {
  data: FollowUpRow[]
  loading?: boolean
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function FollowUpsTable({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: FollowUpsTableProps) {
  return (
    <DataTable
      loading={loading}
      data={data}
      columns={followUpColumns}
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
