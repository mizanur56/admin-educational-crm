import { Button } from 'antd'
import { useMemo, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import PageMeta from '../../../components/PageMeta'
import { useDebounced } from '../../../redux/features/hooks'
import { useListPipelineQuery } from '../../../redux/features/pipeline/pipelineApi'
import { adminCard, adminPage, muted } from '../../../styles/admin'
import ApplicationFilters from '../components/ApplicationFilters'
import ApplicationFormModal from '../components/ApplicationFormModal'
import ApplicationsTable from '../components/ApplicationsTable'
import type { ApplicationRow } from '../types'

export default function ApplicationsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 300 })

  const { data, isFetching, isError } = useListPipelineQuery({
    resource: 'applications',
    search: debouncedSearch,
  })

  const rows = useMemo(() => (data?.items || []) as ApplicationRow[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="Applications"
        description="Track university applications from submission through offers and enrollment."
      />
      <PageHeader
        title="Applications"
        subtitle="Track university applications from submission through offers and enrollment."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Applications' }]}
        extra={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            Add application
          </Button>
        }
      />

      <div className={`${adminCard} grid gap-3`}>
        <ApplicationFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <ApplicationsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <p className={`${muted} mt-3 mb-0 text-sm`}>Demo list data — wire create/update when application APIs are ready.</p>

      <ApplicationFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
