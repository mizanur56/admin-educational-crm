import { useState, type FormEvent } from 'react'
import { changePassword } from '../api/client'
import Button from '../components/Button'
import Input from '../components/Input'
import PageHeader from '../components/PageHeader'
import './admin.css'

export default function Account() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const result = await changePassword(currentPassword, newPassword)
    setMessage(result.ok ? result.data.message || 'Password updated.' : result.data?.error || 'Unable to update password.')
    setPending(false)
    if (result.ok) {
      setCurrentPassword('')
      setNewPassword('')
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Password"
        description="Set or change your password. Passwords are stored hashed, never as plain text."
      />
      <form className="admin-card admin-form account-form" onSubmit={handleSubmit}>
        <label>
          Current password
          <Input.Password
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>
        <label>
          New password
          <Input.Password
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>
        {message ? <p className="admin-banner">{message}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Change password'}
        </Button>
      </form>
    </div>
  )
}
