import { DataTable } from '../../../components/common/Tables'
import type { ReportRow } from '../types'
import { reportColumns } from '../utils/reportColumns'

type ReportsTableProps = {
  data: ReportRow[]
  loading?: boolean
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function ReportsTable({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: ReportsTableProps) {
  return (
    <DataTable
      loading={loading}
      data={data}
      columns={reportColumns}
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
