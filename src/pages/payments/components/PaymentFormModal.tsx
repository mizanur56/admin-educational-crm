import { Button, Form, Input } from 'antd'
import AntModal from '../../../components/common/Modal/AntModal'
import type { PaymentFormValues } from '../types'

type PaymentFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: PaymentFormValues) => void
}

export default function PaymentFormModal({ open, onClose, onSubmit }: PaymentFormModalProps) {
  const [form] = Form.useForm<PaymentFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add payment" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <Form.Item name="invoice" label="Invoice" rules={[{ required: true, message: 'Invoice is required' }]}>
          <Input placeholder="Invoice number" />
        </Form.Item>
        <Form.Item name="payer" label="Payer">
          <Input placeholder="Payer name" />
        </Form.Item>
        <Form.Item name="type" label="Type">
          <Input placeholder="e.g. Tuition, Service fee" />
        </Form.Item>
        <Form.Item name="amount" label="Amount">
          <Input placeholder="Amount" />
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
