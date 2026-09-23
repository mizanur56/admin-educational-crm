import { Button, Form, Input } from 'antd'
import AntModal from '../../../components/common/Modal/AntModal'
import type { DocumentFormValues } from '../types'

type DocumentFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: DocumentFormValues) => void
}

export default function DocumentFormModal({ open, onClose, onSubmit }: DocumentFormModalProps) {
  const [form] = Form.useForm<DocumentFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add document" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <Form.Item name="owner" label="Owner" rules={[{ required: true, message: 'Owner is required' }]}>
          <Input placeholder="Document owner" />
        </Form.Item>
        <Form.Item name="type" label="Type">
          <Input placeholder="e.g. Passport, Transcript" />
        </Form.Item>
        <Form.Item name="category" label="Category">
          <Input placeholder="Category" />
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
