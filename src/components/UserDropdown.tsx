import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Key01Icon, Logout01Icon, UserCircleIcon } from '@hugeicons/core-free-icons'
import { logout } from '../api/client'
import UserAvatar from './UserAvatar'
import type { AuthSession } from '../types'

const CLOSE_MS = 180

type MenuItem = {
  key: string
  label: string
  to: string
  icon: typeof UserCircleIcon
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'profile', label: 'Profile', to: '/profile', icon: UserCircleIcon },
  { key: 'account', label: 'Change password', to: '/account', icon: Key01Icon },
]

export default function UserDropdown({
  auth,
  displayName,
}: {
  auth: AuthSession
  displayName: string
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [pending, setPending] = useState(false)

  const user = auth.user
  const roleName = auth.role?.name?.trim()

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      let innerFrame = 0
      const outerFrame = requestAnimationFrame(() => {
        innerFrame = requestAnimationFrame(() => setIsVisible(true))
      })
      return () => {
        cancelAnimationFrame(outerFrame)
        cancelAnimationFrame(innerFrame)
      }
    }

    setIsVisible(false)
    const timeout = window.setTimeout(() => setShouldRender(false), CLOSE_MS)
    return () => window.clearTimeout(timeout)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (!rootRef.current || !target) return
      if (rootRef.current.contains(target)) return
      setIsOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  async function handleLogout() {
    setIsOpen(false)
    setPending(true)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className={`user-chip dropdown-toggle${isOpen ? ' is-open' : ''}`}
        aria-expanded={isOpen}
        aria-label="User menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <UserAvatar
          key={user.photoUrl || user.id}
          name={displayName}
          photoUrl={user.photoUrl}
          className="user-avatar"
        />
      </button>

      {shouldRender ? (
        <div
          className={`user-dropdown${isVisible ? ' is-visible' : ''}`}
          style={{ transitionDuration: `${CLOSE_MS}ms` }}
        >
          <div className="user-dropdown-header">
            <p className="user-dropdown-name">
              {displayName}
              {roleName ? <span className="user-dropdown-role"> ({roleName})</span> : null}
            </p>
            <p className="user-dropdown-email">{user.email}</p>
          </div>

          <ul className="user-dropdown-list">
            {MENU_ITEMS.map((item) => (
              <li key={item.key}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `user-dropdown-item${isActive ? ' is-active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <HugeiconsIcon icon={item.icon} size={15} color="currentColor" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="user-dropdown-footer">
            <button
              type="button"
              className="user-dropdown-logout"
              onClick={() => void handleLogout()}
              disabled={pending}
            >
              <HugeiconsIcon icon={Logout01Icon} size={15} color="currentColor" strokeWidth={1.5} />
              {pending ? 'Signing out…' : 'Logout'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
