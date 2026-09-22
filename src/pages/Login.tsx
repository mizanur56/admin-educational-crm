import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getMe, login } from '../api/client'
import { isAuthSession } from '../lib/auth-session'
import Button from '../components/Button'
import Input from '../components/Input'
import PageLoader from '../components/PageLoader'

type SessionState = 'checking' | 'authenticated' | 'anonymous'

export default function Login() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [session, setSession] = useState<SessionState>('checking')

  useEffect(() => {
    let cancelled = false

    getMe()
      .then((result) => {
        if (!cancelled) {
          setSession(result.ok && isAuthSession(result.data) ? 'authenticated' : 'anonymous')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession('anonymous')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (session === 'checking') {
    return <PageLoader />
  }

  if (session === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')

    try {
      const result = await login(identifier.trim(), password, rememberMe)

      if (result.ok) {
        if (isAuthSession(result.data)) {
          navigate('/dashboard', { replace: true })
          return
        }

        setMessage('Could not sign in.')
        return
      }

      setMessage(result.data?.error || 'Could not sign in.')
    } catch {
      setMessage('Server is not reachable. Start server.educational.crm.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className="w-full max-w-[400px] rounded-2xl border border-card-border bg-surface p-8 shadow-card"
      onSubmit={handleSubmit}
    >
      <p className="mb-2 text-[0.85rem] font-bold tracking-[0.04em] text-link uppercase">Education CRM</p>
      <h1 className="mb-2">Welcome back</h1>
      <p className="mb-6 text-text-muted">Sign in to continue to your dashboard</p>

      <label htmlFor="identifier">Email or Username</label>
      <Input
        id="identifier"
        type="text"
        autoComplete="username"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder="Email or username"
        required
      />

      <label htmlFor="password">Password</label>
      <Input.Password
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Enter password"
        required
      />

      <label className="mb-4 flex items-center gap-2 font-medium" htmlFor="rememberMe">
        <input
          id="rememberMe"
          type="checkbox"
          className="m-0 w-auto"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
        />
        Remember me
      </label>

      {message ? <p className="mb-4 text-danger">{message}</p> : null}

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? 'Signing in…' : 'Sign In'}
      </Button>

      <p className="mt-4 mb-0 text-[0.85rem] text-text-muted">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </form>
  )
}
