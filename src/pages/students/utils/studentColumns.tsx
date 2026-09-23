import type { ColumnsType } from 'antd/es/table'
import type { StudentRow } from '../types'
import { studentStatusClass } from './studentStatus'

export const studentColumns: ColumnsType<StudentRow> = [
  { title: 'Student ID', dataIndex: 'studentId', key: 'studentId', render: (v: string) => v || '—' },
  { title: 'Name', dataIndex: 'name', key: 'name', render: (v: string) => v || '—' },
  { title: 'Destination', dataIndex: 'destination', key: 'destination', render: (v: string) => v || '—' },
  { title: 'Program', dataIndex: 'program', key: 'program', render: (v: string) => v || '—' },
  { title: 'Counsellor', dataIndex: 'counsellor', key: 'counsellor', render: (v: string) => v || '—' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <span className={studentStatusClass(v || '')}>{v || '—'}</span>,
  },
  { title: 'Enrolled', dataIndex: 'enrolled', key: 'enrolled', render: (v: string) => v || '—' },
]
