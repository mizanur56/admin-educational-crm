import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Button, Form } from 'antd'
import Input from '../../../components/Input'
import PageMeta from '../../../components/PageMeta'
import { useResetPasswordMutation } from '../../../redux/features/auth/authApi'

type ResetValues = {
  password: string
}

const cardClass =
  'w-full max-w-[400px] rounded-2xl border border-card-border bg-surface p-6 shadow-card'

const formClass =
  '[&_.ant-form-item-label>label]:text-[0.9rem] [&_.ant-form-item-label>label]:font-semibold [&_.ant-form-item-label>label]:text-text-strong'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [resetPassword, { isLoading }] = useResetPasswordMutation()
  const [form] = Form.useForm<ResetValues>()
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function onFinish(values: ResetValues) {
    setMessage('')

    try {
      const data = await resetPassword({ token, password: values.password }).unwrap()
      setSuccess(true)
      setMessage(data?.message || 'Password has been reset. Please sign in.')
    } catch (error) {
      const err = error as { data?: { error?: string }; status?: string | number }
      setSuccess(false)
      setMessage(
        err?.data?.error ||
          (err?.status === 'FETCH_ERROR'
            ? 'Server is not reachable. Start campusly-crm-api.'
            : 'Could not reset password.'),
      )
    }
  }

  return (
    <>
      <PageMeta
        title="Reset Password"
        description="Choose a new secure password to regain access to your EduConsult CRM account."
      />
      <div className={cardClass}>
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onFinish} className={formClass}>
          <div className="mb-6 text-center">
            <h1 className="m-0 mb-1.5 text-[1.55rem] leading-tight font-bold tracking-tight text-text-strong">
              Reset password
            </h1>
            <p className="m-0 text-[0.92rem] text-text-muted">
              Choose a new password of at least 8 characters.
            </p>
          </div>

          <Form.Item
            name="password"
            label="New password"
            rules={[
              { required: true, message: 'Enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password autoComplete="new-password" placeholder="Enter a new password" />
          </Form.Item>

          {message ? (
            <Alert type={success ? 'success' : 'error'} showIcon message={message} className="mb-4" />
          ) : null}

          <Form.Item className="mb-0!">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isLoading}
              disabled={!token}
            >
              Reset password
            </Button>
          </Form.Item>

          <p className="mt-5 mb-0 text-center">
            <Link
              to="/login"
              className="text-[0.85rem] font-semibold text-primary! no-underline hover:text-primary-hover! hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </Form>
      </div>
    </>
  )
}
