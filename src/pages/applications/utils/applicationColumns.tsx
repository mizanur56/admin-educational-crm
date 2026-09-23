import type { ColumnsType } from 'antd/es/table'
import type { ApplicationRow } from '../types'
import { applicationStatusClass } from './applicationStatus'

export const applicationColumns: ColumnsType<ApplicationRow> = [
  { title: 'Applicant', dataIndex: 'applicant', key: 'applicant', render: (v: string) => v || '—' },
  { title: 'University', dataIndex: 'university', key: 'university', render: (v: string) => v || '—' },
  { title: 'Program', dataIndex: 'program', key: 'program', render: (v: string) => v || '—' },
  { title: 'Intake', dataIndex: 'intake', key: 'intake', render: (v: string) => v || '—' },
  { title: 'Counsellor', dataIndex: 'counsellor', key: 'counsellor', render: (v: string) => v || '—' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <span className={applicationStatusClass(v || '')}>{v || '—'}</span>,
  },
  { title: 'Submitted', dataIndex: 'submitted', key: 'submitted', render: (v: string) => v || '—' },
]
