import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/client'
import Button from '../components/Button'
import Input from '../components/Input'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')

    try {
      const result = await resetPassword(token, password)
      if (result.ok) {
        setSuccess(true)
        setMessage(result.data?.message || 'Password has been reset. Please sign in.')
      } else {
        setMessage(result.data?.error || 'Could not reset password.')
      }
    } catch {
      setMessage('Server is not reachable. Start server.educational.crm.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <p className="eyebrow">Education CRM</p>
      <h1>Reset password</h1>
      <p className="subtitle">Choose a new password of at least 8 characters.</p>

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

      {message ? <p className={success ? 'subtitle' : 'error'}>{message}</p> : null}

      <Button type="submit" fullWidth disabled={pending || !token}>
        {pending ? 'Saving…' : 'Reset password'}
      </Button>

      <p className="hint">
        <Link to="/login">Back to sign in</Link>
      </p>
    </form>
  )
}
