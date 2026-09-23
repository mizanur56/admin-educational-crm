import { Button } from 'antd'
import { useMemo, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import PageMeta from '../../../components/PageMeta'
import { useDebounced } from '../../../redux/features/hooks'
import { useListPipelineQuery } from '../../../redux/features/pipeline/pipelineApi'
import { adminCard, adminPage, muted } from '../../../styles/admin'
import FollowUpFilters from '../components/FollowUpFilters'
import FollowUpFormModal from '../components/FollowUpFormModal'
import FollowUpsTable from '../components/FollowUpsTable'
import type { FollowUpRow } from '../types'

export default function FollowUpsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 300 })

  const { data, isFetching, isError } = useListPipelineQuery({
    resource: 'follow-ups',
    search: debouncedSearch,
  })

  const rows = useMemo(() => (data?.items || []) as FollowUpRow[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="Follow-ups"
        description="Plan and complete follow-up calls, emails, and tasks with leads and students."
      />
      <PageHeader
        title="Follow-ups"
        subtitle="Plan and complete follow-up calls, emails, and tasks with leads and students."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Follow-ups' }]}
        extra={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            Add follow-up
          </Button>
        }
      />

      <div className={`${adminCard} grid gap-3`}>
        <FollowUpFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <FollowUpsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <p className={`${muted} mt-3 mb-0 text-sm`}>Demo list data — wire create/update when follow-up APIs are ready.</p>

      <FollowUpFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
