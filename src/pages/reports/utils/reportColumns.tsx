import type { ColumnsType } from 'antd/es/table'
import type { ReportRow } from '../types'
import { reportStatusClass } from './reportStatus'

export const reportColumns: ColumnsType<ReportRow> = [
  { title: 'Metric', dataIndex: 'metric', key: 'metric', render: (v: string) => v || '—' },
  { title: 'Period', dataIndex: 'period', key: 'period', render: (v: string) => v || '—' },
  { title: 'Value', dataIndex: 'value', key: 'value', render: (v: string) => v || '—' },
  { title: 'Change', dataIndex: 'change', key: 'change', render: (v: string) => v || '—' },
  { title: 'Owner team', dataIndex: 'owner', key: 'owner', render: (v: string) => v || '—' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <span className={reportStatusClass(v || '')}>{v || '—'}</span>,
  },
]
