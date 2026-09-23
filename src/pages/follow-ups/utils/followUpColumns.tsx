import type { ColumnsType } from 'antd/es/table'
import type { FollowUpRow } from '../types'
import { followUpStatusClass } from './followUpStatus'

export const followUpColumns: ColumnsType<FollowUpRow> = [
  { title: 'Contact', dataIndex: 'contact', key: 'contact', render: (v: string) => v || '—' },
  { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => v || '—' },
  { title: 'Owner', dataIndex: 'owner', key: 'owner', render: (v: string) => v || '—' },
  { title: 'Due', dataIndex: 'due', key: 'due', render: (v: string) => v || '—' },
  { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (v: string) => v || '—' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <span className={followUpStatusClass(v || '')}>{v || '—'}</span>,
  },
]
