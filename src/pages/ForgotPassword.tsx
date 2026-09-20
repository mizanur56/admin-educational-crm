import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/client'
import Button from '../components/Button'
import Input from '../components/Input'

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('')
  const [message, setMessage] = useState('')
  const [resetPath, setResetPath] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    setResetPath('')

    try {
      const result = await requestPasswordReset(identifier.trim())
      if (result.ok) {
        setMessage(result.data?.message || 'If an account exists, password reset instructions have been sent.')
        setResetPath(result.data?.devResetPath || '')
      } else {
        setMessage(result.data?.error || 'Could not send reset instructions.')
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
      <h1>Forgot password</h1>
      <p className="subtitle">Enter your email or username. A reset link will be created for an active account.</p>

      <label htmlFor="identifier">Email or Username</label>
      <Input
        id="identifier"
        type="text"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder="Email or username"
        required
      />

      {message ? <p className={resetPath ? 'subtitle' : 'error'}>{message}</p> : null}
      {resetPath ? (
        <p className="hint">
          Dev reset: <Link to={resetPath}>{resetPath}</Link>
        </p>
      ) : null}

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>

      <p className="hint">
        <Link to="/login">Back to sign in</Link>
      </p>
    </form>
  )
}
