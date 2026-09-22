import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon, UserCircleIcon } from '@hugeicons/core-free-icons'
import { logout } from '../api/client'
import { hasPermission } from '../lib/access'
import type { NavIconName } from '../config/navigation'
import NavIcon from './NavIcon'
import UserAvatar from './UserAvatar'
import type { AuthSession } from '../types'

const CLOSE_MS = 180

type QuickMenuItem = {
  key: string
  label: string
  to: string
  icon: NavIconName
  permission?: string
}

const ACCOUNT_MENUS = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', navIcon: 'grid' as const },
  { key: 'profile', label: 'Profile', to: '/profile', hugeIcon: UserCircleIcon },
]

const QUICK_MENUS: QuickMenuItem[] = [
  { key: 'leads', label: 'Leads', to: '/leads', icon: 'users', permission: 'lead:view' },
  { key: 'applications', label: 'Applications', to: '/applications', icon: 'file', permission: 'lead:convert' },
  { key: 'students', label: 'Students', to: '/students', icon: 'graduate', permission: 'lead:convert' },
  { key: 'follow-ups', label: 'Follow-ups', to: '/follow-ups', icon: 'bell', permission: 'follow_up:view' },
  { key: 'documents', label: 'Documents', to: '/documents', icon: 'folder', permission: 'document:view' },
  { key: 'payments', label: 'Payments', to: '/payments', icon: 'card', permission: 'payment:view' },
  { key: 'reports', label: 'Reports', to: '/reports', icon: 'chart', permission: 'report:view' },
]

function isPathActive(pathname: string, to: string) {
  if (to === '/dashboard') return pathname === '/' || pathname === '/dashboard'
  return pathname === to || pathname.startsWith(`${to}/`)
}

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

  const quickMenus = useMemo(
    () => QUICK_MENUS.filter((item) => !item.permission || hasPermission(auth, item.permission)),
    [auth],
  )

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
            {ACCOUNT_MENUS.map((item) => {
              const active = isPathActive(location.pathname, item.to)
              return (
                <li key={item.key}>
                  <NavLink
                    to={item.to}
                    className={`user-dropdown-item${active ? ' is-active' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    {'navIcon' in item && item.navIcon ? (
                      <NavIcon name={item.navIcon} size={15} />
                    ) : (
                      <HugeiconsIcon
                        icon={item.hugeIcon!}
                        size={15}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                    )}
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>

          {quickMenus.length > 0 ? (
            <>
              <div className="user-dropdown-section">
                <p className="user-dropdown-section-label">Quick</p>
              </div>
              <ul className="user-dropdown-list user-dropdown-list-quick">
                {quickMenus.map((item) => {
                  const active = isPathActive(location.pathname, item.to)
                  return (
                    <li key={item.key}>
                      <NavLink
                        to={item.to}
                        className={`user-dropdown-item${active ? ' is-active' : ''}`}
                        onClick={() => setIsOpen(false)}
                      >
                        <NavIcon name={item.icon} size={15} />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : null}

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
