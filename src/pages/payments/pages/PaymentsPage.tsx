import { Button } from 'antd'
import { useMemo, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import PageMeta from '../../../components/PageMeta'
import { useDebounced } from '../../../redux/features/hooks'
import { useListPipelineQuery } from '../../../redux/features/pipeline/pipelineApi'
import { adminCard, adminPage, muted } from '../../../styles/admin'
import PaymentFilters from '../components/PaymentFilters'
import PaymentFormModal from '../components/PaymentFormModal'
import PaymentsTable from '../components/PaymentsTable'
import type { PaymentRow } from '../types'

export default function PaymentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 300 })

  const { data, isFetching, isError } = useListPipelineQuery({
    resource: 'payments',
    search: debouncedSearch,
  })

  const rows = useMemo(() => (data?.items || []) as PaymentRow[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="Payments"
        description="Monitor fees, invoices, and payment status across students and applications."
      />
      <PageHeader
        title="Payments"
        subtitle="Monitor fees, invoices, and payment status across students and applications."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Payments' }]}
        extra={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            Add payment
          </Button>
        }
      />

      <div className={`${adminCard} grid gap-3`}>
        <PaymentFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <PaymentsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <p className={`${muted} mt-3 mb-0 text-sm`}>Demo list data — wire create/update when payment APIs are ready.</p>

      <PaymentFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
