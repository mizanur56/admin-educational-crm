import { Button } from 'antd'
import { useMemo, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import PageMeta from '../../../components/PageMeta'
import { useDebounced } from '../../../redux/features/hooks'
import { useListPipelineQuery } from '../../../redux/features/pipeline/pipelineApi'
import { adminCard, adminPage, muted } from '../../../styles/admin'
import StudentFilters from '../components/StudentFilters'
import StudentFormModal from '../components/StudentFormModal'
import StudentsTable from '../components/StudentsTable'
import type { StudentRow } from '../types'

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 300 })

  const { data, isFetching, isError } = useListPipelineQuery({
    resource: 'students',
    search: debouncedSearch,
  })

  const rows = useMemo(() => (data?.items || []) as StudentRow[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="Students"
        description="Manage student profiles, academic progress, and advisory engagement in one place."
      />
      <PageHeader
        title="Students"
        subtitle="Manage student profiles, academic progress, and advisory engagement in one place."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Students' }]}
        extra={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            Add student
          </Button>
        }
      />

      <div className={`${adminCard} grid gap-3`}>
        <StudentFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <StudentsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <p className={`${muted} mt-3 mb-0 text-sm`}>Demo list data — wire create/update when student APIs are ready.</p>

      <StudentFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
