import { DataTable } from '../../../components/common/Tables'
import type { DocumentRow } from '../types'
import { documentColumns } from '../utils/documentColumns'

type DocumentsTableProps = {
  data: DocumentRow[]
  loading?: boolean
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function DocumentsTable({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: DocumentsTableProps) {
  return (
    <DataTable
      loading={loading}
      data={data}
      columns={documentColumns}
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
