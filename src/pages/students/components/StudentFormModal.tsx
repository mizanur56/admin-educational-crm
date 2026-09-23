import { Button, Form, Input } from 'antd'
import AntModal from '../../../components/common/Modal/AntModal'
import type { StudentFormValues } from '../types'

type StudentFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: StudentFormValues) => void
}

export default function StudentFormModal({ open, onClose, onSubmit }: StudentFormModalProps) {
  const [form] = Form.useForm<StudentFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add student" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="Student name" />
        </Form.Item>
        <Form.Item name="studentId" label="Student ID">
          <Input placeholder="Student ID" />
        </Form.Item>
        <Form.Item name="destination" label="Destination">
          <Input placeholder="Country / city" />
        </Form.Item>
        <Form.Item name="program" label="Program">
          <Input placeholder="Program" />
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
