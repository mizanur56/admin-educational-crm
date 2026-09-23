import { Button, Form, Input } from 'antd'
import AntModal from '../../../components/common/Modal/AntModal'
import type { ApplicationFormValues } from '../types'

type ApplicationFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: ApplicationFormValues) => void
}

export default function ApplicationFormModal({ open, onClose, onSubmit }: ApplicationFormModalProps) {
  const [form] = Form.useForm<ApplicationFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add application" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <Form.Item name="applicant" label="Applicant" rules={[{ required: true, message: 'Applicant is required' }]}>
          <Input placeholder="Applicant name" />
        </Form.Item>
        <Form.Item name="university" label="University">
          <Input placeholder="University" />
        </Form.Item>
        <Form.Item name="program" label="Program">
          <Input placeholder="Program" />
        </Form.Item>
        <Form.Item name="intake" label="Intake">
          <Input placeholder="e.g. Sep 2026" />
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
