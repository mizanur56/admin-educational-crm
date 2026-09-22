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

function menuItemClass(active: boolean) {
  return [
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-text-strong no-underline transition-[background,color] duration-150 ease-in-out',
    '[&_svg]:shrink-0 [&_svg]:text-text-muted [&_svg]:transition-colors [&_svg]:duration-150 [&_svg]:ease-in-out',
    'hover:text-nav-active hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] hover:[&_svg]:text-nav-active',
    active
      ? 'bg-nav-active-bg text-nav-active [&_svg]:text-nav-active hover:bg-nav-active-bg'
      : '',
  ]
    .filter(Boolean)
    .join(' ')
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
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={[
          'grid size-11 cursor-pointer place-items-center rounded-full border border-border bg-surface p-0 transition-[border-color,background,box-shadow] duration-200 ease-in-out',
          'hover:border-input-border hover:bg-hover-bg',
          isOpen
            ? 'border-primary shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-expanded={isOpen}
        aria-label="User menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <UserAvatar
          key={user.photoUrl || user.id}
          name={displayName}
          photoUrl={user.photoUrl}
          className="grid size-8 place-items-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-primary)_16%,white)] text-[0.72rem] font-bold text-primary-active dark:bg-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] dark:text-nav-active [&_img]:size-full [&_img]:object-cover"
        />
      </button>

      {shouldRender ? (
        <div
          className={[
            'absolute top-[calc(100%+10px)] right-0 z-40 flex max-h-[min(70vh,480px)] w-[260px] origin-top-right flex-col overflow-hidden rounded-[10px] border border-border bg-surface p-0 shadow-card transition-[opacity,transform] ease-out',
            isVisible
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none -translate-y-1.5 scale-[0.97] opacity-0',
          ].join(' ')}
          style={{ transitionDuration: `${CLOSE_MS}ms` }}
        >
          <div className="shrink-0 border-b border-border-subtle px-3 py-2">
            <p className="m-0 overflow-hidden text-[13px] leading-tight font-semibold text-ellipsis whitespace-nowrap text-text-strong">
              {displayName}
              {roleName ? <span className="font-normal text-text-muted"> ({roleName})</span> : null}
            </p>
            <p className="mt-0.5 mb-0 overflow-hidden text-[11px] leading-tight text-ellipsis whitespace-nowrap text-text-muted">
              {user.email}
            </p>
          </div>

          <ul className="m-0 flex list-none flex-col gap-px p-1.5">
            {ACCOUNT_MENUS.map((item) => {
              const active = isPathActive(location.pathname, item.to)
              return (
                <li key={item.key}>
                  <NavLink
                    to={item.to}
                    className={menuItemClass(active)}
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
              <div className="shrink-0 px-3 pt-0.5">
                <p className="m-0 text-[10px] font-semibold tracking-[0.06em] text-text-faint uppercase">Quick</p>
              </div>
              <ul className="m-0 flex min-h-0 flex-[1_1_auto] list-none flex-col gap-px overflow-y-auto p-1.5 pt-0">
                {quickMenus.map((item) => {
                  const active = isPathActive(location.pathname, item.to)
                  return (
                    <li key={item.key}>
                      <NavLink
                        to={item.to}
                        className={menuItemClass(active)}
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

          <div className="border-t border-border-subtle p-1.5">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 font-[inherit] text-[13px] font-medium text-red-600 transition-colors duration-150 ease-in-out hover:bg-[color-mix(in_srgb,#dc2626_8%,transparent)] disabled:cursor-wait disabled:opacity-70 dark:text-red-400 dark:hover:bg-[color-mix(in_srgb,#f87171_12%,transparent)]"
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
