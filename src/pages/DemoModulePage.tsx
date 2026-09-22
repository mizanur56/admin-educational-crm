import { adminCard, adminPage, muted, statusPill } from '../styles/admin'
import { useMemo, useState, type ReactNode } from 'react'
import { Input } from 'antd'
import { DataTable } from '../components/common/Tables'
import PageHeader from '../components/PageHeader'
import PageMeta from '../components/PageMeta'
import { useDebounced } from '../redux/features/hooks'
import {
  useListPipelineQuery,
  type PipelineResource,
} from '../redux/features/pipeline/pipelineApi'

export type DemoColumn = {
  key: string
  label: string
  width?: number
  render?: (value: string, row: Record<string, string>) => ReactNode
}

export type DemoModuleConfig = {
  title: string
  subtitle: string
  searchPlaceholder: string
  resource: PipelineResource
  columns: DemoColumn[]
  note?: string
}

function statusClass(status: string) {
  const key = status.toLowerCase()
  if (['new', 'pending', 'draft', 'submitted'].includes(key)) {
    return `${statusPill} bg-[#e8f1ff] text-[#2563eb] dark:bg-blue-600/20 dark:text-[#93c5fd]`
  }
  if (['paid', 'verified', 'enrolled', 'completed', 'active', 'converted'].includes(key)) {
    return `${statusPill} bg-[#e7f8ef] text-[#16a34a] dark:bg-green-600/20 dark:text-[#86efac]`
  }
  if (['contacted', 'in review', 'partial', 'counselling', 'processing'].includes(key)) {
    return `${statusPill} bg-[#eee8ff] text-[#7c3aed] dark:bg-violet-600/20 dark:text-[#c4b5fd]`
  }
  if (['overdue', 'rejected', 'lost', 'failed', 'cancelled'].includes(key)) {
    return `${statusPill} bg-[#ffe8ee] text-[#e11d48] dark:bg-rose-600/20 dark:text-[#fda4af]`
  }
  if (['follow-up', 'interested', 'offer sent', 'due soon'].includes(key)) {
    return `${statusPill} bg-[#fff1e6] text-[#d97706] dark:bg-amber-600/20 dark:text-[#fcd34d]`
  }
  return `${statusPill} bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]`
}

export default function DemoModulePage({ config }: { config: DemoModuleConfig }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 300 })

  const { data, isFetching, isError } = useListPipelineQuery({
    resource: config.resource,
    search: debouncedSearch,
  })

  const rows = useMemo(() => (data?.items || []) as Array<Record<string, string>>, [data?.items])

  const columns = useMemo(
    () =>
      config.columns.map((column) => ({
        title: column.label,
        dataIndex: column.key,
        key: column.key,
        width: column.width,
        render: (value: string, record: Record<string, string>) => {
          if (column.render) return column.render(value, record)
          if (column.key === 'status') {
            return <span className={statusClass(value || '')}>{value || '—'}</span>
          }
          return value || '—'
        },
      })),
    [config.columns],
  )

  return (
    <div className={adminPage}>
      <PageMeta title={config.title} description={config.subtitle} />
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: config.title }]}
      />

      {config.note ? <p className={`${muted} m-0`}>{config.note}</p> : null}

      <div className={`${adminCard} grid gap-3`}>
        <Input.Search
          allowClear
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder={config.searchPlaceholder}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <DataTable
          loading={isFetching}
          data={rows}
          columns={columns}
          rowKey="id"
          isPaginate
          currentPage={page}
          setCurrentPage={setPage}
          limit={limit}
          setLimit={setLimit}
          total={data?.total || rows.length}
          showSizeChanger={(data?.total || rows.length) > 10}
        />
      </div>
    </div>
  )
}
