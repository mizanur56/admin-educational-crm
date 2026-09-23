import { Button, Form, Input } from 'antd'
import AntModal from '../../../components/common/Modal/AntModal'
import type { LeadFormValues } from '../types'

type LeadFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: LeadFormValues) => void
}

export default function LeadFormModal({ open, onClose, onSubmit }: LeadFormModalProps) {
  const [form] = Form.useForm<LeadFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add lead" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <Form.Item name="name" label="Lead name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="Full name" />
        </Form.Item>
        <Form.Item name="phone" label="Phone">
          <Input placeholder="Phone number" />
        </Form.Item>
        <Form.Item name="country" label="Country">
          <Input placeholder="Preferred country" />
        </Form.Item>
        <Form.Item name="source" label="Source">
          <Input placeholder="e.g. Facebook, Walk-in" />
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
