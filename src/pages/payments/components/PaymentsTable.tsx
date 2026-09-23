import { DataTable } from '../../../components/common/Tables'
import type { PaymentRow } from '../types'
import { paymentColumns } from '../utils/paymentColumns'

type PaymentsTableProps = {
  data: PaymentRow[]
  loading?: boolean
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function PaymentsTable({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: PaymentsTableProps) {
  return (
    <DataTable
      loading={loading}
      data={data}
      columns={paymentColumns}
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
