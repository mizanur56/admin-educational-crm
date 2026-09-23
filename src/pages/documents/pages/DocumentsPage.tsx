import { Button } from 'antd'
import { useMemo, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import PageMeta from '../../../components/PageMeta'
import { useDebounced } from '../../../redux/features/hooks'
import { useListPipelineQuery } from '../../../redux/features/pipeline/pipelineApi'
import { adminCard, adminPage, muted } from '../../../styles/admin'
import DocumentFilters from '../components/DocumentFilters'
import DocumentFormModal from '../components/DocumentFormModal'
import DocumentsTable from '../components/DocumentsTable'
import type { DocumentRow } from '../types'

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 300 })

  const { data, isFetching, isError } = useListPipelineQuery({
    resource: 'documents',
    search: debouncedSearch,
  })

  const rows = useMemo(() => (data?.items || []) as DocumentRow[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="Documents"
        description="Upload, review, and organize student and staff documents for admissions workflows."
      />
      <PageHeader
        title="Documents"
        subtitle="Upload, review, and organize student and staff documents for admissions workflows."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Documents' }]}
        extra={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            Add document
          </Button>
        }
      />

      <div className={`${adminCard} grid gap-3`}>
        <DocumentFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <DocumentsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <p className={`${muted} mt-3 mb-0 text-sm`}>Demo list data — wire create/update when document APIs are ready.</p>

      <DocumentFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
