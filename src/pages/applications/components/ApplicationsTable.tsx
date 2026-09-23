import { DataTable } from '../../../components/common/Tables'
import type { ApplicationRow } from '../types'
import { applicationColumns } from '../utils/applicationColumns'

type ApplicationsTableProps = {
  data: ApplicationRow[]
  loading?: boolean
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function ApplicationsTable({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: ApplicationsTableProps) {
  return (
    <DataTable
      loading={loading}
      data={data}
      columns={applicationColumns}
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
