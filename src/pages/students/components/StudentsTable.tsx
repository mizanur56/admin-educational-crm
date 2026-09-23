import { DataTable } from '../../../components/common/Tables'
import type { StudentRow } from '../types'
import { studentColumns } from '../utils/studentColumns'

type StudentsTableProps = {
  data: StudentRow[]
  loading?: boolean
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function StudentsTable({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: StudentsTableProps) {
  return (
    <DataTable
      loading={loading}
      data={data}
      columns={studentColumns}
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
