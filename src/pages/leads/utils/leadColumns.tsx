import type { ColumnsType } from 'antd/es/table'
import type { LeadRow } from '../types'
import { leadStatusClass } from './leadStatus'

export const leadColumns: ColumnsType<LeadRow> = [
  { title: 'Lead', dataIndex: 'name', key: 'name', render: (value: string) => value || '—' },
  { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (value: string) => value || '—' },
  { title: 'Country', dataIndex: 'country', key: 'country', render: (value: string) => value || '—' },
  { title: 'Source', dataIndex: 'source', key: 'source', render: (value: string) => value || '—' },
  { title: 'Owner', dataIndex: 'owner', key: 'owner', render: (value: string) => value || '—' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (value: string) => <span className={leadStatusClass(value || '')}>{value || '—'}</span>,
  },
  { title: 'Updated', dataIndex: 'updated', key: 'updated', render: (value: string) => value || '—' },
]
