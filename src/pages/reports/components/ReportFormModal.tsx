import { Button, Form, Input } from 'antd'
import AntModal from '../../../components/common/Modal/AntModal'
import type { ReportFormValues } from '../types'

type ReportFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: ReportFormValues) => void
}

export default function ReportFormModal({ open, onClose, onSubmit }: ReportFormModalProps) {
  const [form] = Form.useForm<ReportFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add report metric" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <Form.Item name="metric" label="Metric" rules={[{ required: true, message: 'Metric is required' }]}>
          <Input placeholder="Metric name" />
        </Form.Item>
        <Form.Item name="period" label="Period">
          <Input placeholder="e.g. This month" />
        </Form.Item>
        <Form.Item name="value" label="Value">
          <Input placeholder="Value" />
        </Form.Item>
        <div className="mt-2 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </div>
      </Form>
    </AntModal>
  )
}
