import type { ColumnsType } from 'antd/es/table'
import type { PaymentRow } from '../types'
import { paymentStatusClass } from './paymentStatus'

export const paymentColumns: ColumnsType<PaymentRow> = [
  { title: 'Invoice', dataIndex: 'invoice', key: 'invoice', render: (v: string) => v || '—' },
  { title: 'Payer', dataIndex: 'payer', key: 'payer', render: (v: string) => v || '—' },
  { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => v || '—' },
  { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: string) => v || '—' },
  { title: 'Method', dataIndex: 'method', key: 'method', render: (v: string) => v || '—' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <span className={paymentStatusClass(v || '')}>{v || '—'}</span>,
  },
  { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v || '—' },
]
