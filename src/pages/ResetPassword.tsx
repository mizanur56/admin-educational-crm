import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import PageMeta from '../components/PageMeta'
import { useResetPasswordMutation } from '../redux/features/auth/authApi'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [resetPassword, { isLoading }] = useResetPasswordMutation()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    try {
      const data = await resetPassword({ token, password }).unwrap()
      setSuccess(true)
      setMessage(data?.message || 'Password has been reset. Please sign in.')
    } catch (error) {
      const err = error as { data?: { error?: string }; status?: string | number }
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
      <form
        className="w-full max-w-[400px] rounded-2xl border border-card-border bg-surface p-8 shadow-card"
        onSubmit={handleSubmit}
      >
        <p className="mb-2 text-[0.85rem] font-bold tracking-[0.04em] text-link uppercase">
          Education CRM
        </p>
        <h1 className="mb-2">Reset password</h1>
        <p className="mb-6 text-text-muted">Choose a new password of at least 8 characters.</p>

        <label htmlFor="password">New password</label>
        <Input.Password
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter a new password"
          required
          minLength={8}
        />

        {message ? (
          <p className={success ? 'mb-6 text-text-muted' : 'mb-4 text-danger'}>{message}</p>
        ) : null}

        <Button type="submit" fullWidth disabled={isLoading || !token}>
          {isLoading ? 'Saving…' : 'Reset password'}
        </Button>

        <p className="mt-4 mb-0 text-[0.85rem] text-text-muted">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </>
  )
}
