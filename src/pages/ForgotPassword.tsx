import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import PageMeta from '../components/PageMeta'
import { useForgotPasswordMutation } from '../redux/features/auth/authApi'

export default function ForgotPassword() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()
  const [identifier, setIdentifier] = useState('')
  const [message, setMessage] = useState('')
  const [resetPath, setResetPath] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setResetPath('')

    try {
      const data = await forgotPassword({ identifier: identifier.trim() }).unwrap()
      setMessage(data?.message || 'If an account exists, password reset instructions have been sent.')
      setResetPath(data?.devResetPath || '')
    } catch (error) {
      const err = error as { data?: { error?: string }; status?: string | number }
      setMessage(
        err?.data?.error ||
          (err?.status === 'FETCH_ERROR'
            ? 'Server is not reachable. Start campusly-crm-api.'
            : 'Could not send reset instructions.'),
      )
    }
  }

  return (
    <>
      <PageMeta
        title="Forgot Password"
        description="Request a secure password reset link for your EduConsult CRM account."
      />
      <form
        className="w-full max-w-[400px] rounded-2xl border border-card-border bg-surface p-8 shadow-card"
        onSubmit={handleSubmit}
      >
        <p className="mb-2 text-[0.85rem] font-bold tracking-[0.04em] text-link uppercase">
          Education CRM
        </p>
        <h1 className="mb-2">Forgot password</h1>
        <p className="mb-6 text-text-muted">
          Enter your email or username. A reset link will be created for an active account.
        </p>

        <label htmlFor="identifier">Email or Username</label>
        <Input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Email or username"
          required
        />

        {message ? (
          <p className={resetPath ? 'mb-6 text-text-muted' : 'mb-4 text-danger'}>{message}</p>
        ) : null}
        {resetPath ? (
          <p className="mt-4 mb-0 text-[0.85rem] text-text-muted">
            Dev reset: <Link to={resetPath}>{resetPath}</Link>
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? 'Sending…' : 'Send reset link'}
        </Button>

        <p className="mt-4 mb-0 text-[0.85rem] text-text-muted">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </>
  )
}
