import { Button, Form, Input } from 'antd'
import AntModal from '../../../components/common/Modal/AntModal'
import type { FollowUpFormValues } from '../types'

type FollowUpFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: FollowUpFormValues) => void
}

export default function FollowUpFormModal({ open, onClose, onSubmit }: FollowUpFormModalProps) {
  const [form] = Form.useForm<FollowUpFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add follow-up" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <Form.Item name="contact" label="Contact" rules={[{ required: true, message: 'Contact is required' }]}>
          <Input placeholder="Contact name" />
        </Form.Item>
        <Form.Item name="type" label="Type">
          <Input placeholder="Call, Email, Visit…" />
        </Form.Item>
        <Form.Item name="owner" label="Owner">
          <Input placeholder="Assigned to" />
        </Form.Item>
        <Form.Item name="due" label="Due">
          <Input placeholder="Due date" />
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
