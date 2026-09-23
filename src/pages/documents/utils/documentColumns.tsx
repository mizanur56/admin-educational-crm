import type { ColumnsType } from 'antd/es/table'
import type { DocumentRow } from '../types'
import { documentStatusClass } from './documentStatus'

export const documentColumns: ColumnsType<DocumentRow> = [
  { title: 'Owner', dataIndex: 'owner', key: 'owner', render: (v: string) => v || '—' },
  { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => v || '—' },
  { title: 'Category', dataIndex: 'category', key: 'category', render: (v: string) => v || '—' },
  { title: 'Uploaded by', dataIndex: 'uploadedBy', key: 'uploadedBy', render: (v: string) => v || '—' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <span className={documentStatusClass(v || '')}>{v || '—'}</span>,
  },
  { title: 'Updated', dataIndex: 'updated', key: 'updated', render: (v: string) => v || '—' },
]
