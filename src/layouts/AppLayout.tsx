import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Cancel01Icon, Logout03Icon, Menu01Icon } from '@hugeicons/core-free-icons'
import { logout } from '../api/client'
import GlobalSearch from '../components/GlobalSearch'
import NavIcon from '../components/NavIcon'
import ThemeToggle from '../components/ThemeToggle'
import UserDropdown from '../components/UserDropdown'
import { APP_NAV_GROUPS, type NavItem } from '../config/navigation'
import { hasPermission } from '../lib/access'
import PageLoader from '../components/PageLoader'
import type { AuthSession } from '../types'

function displayName(auth: AuthSession | null | undefined) {
  if (auth?.user?.fullName) {
    return auth.user.fullName
  }
  const raw = auth?.user?.username || auth?.user?.email || 'User'
  const first = String(raw).split(/[.@]/)[0]
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function ChevronsIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {direction === 'right' ? (
        <>
          <path d="m6 17 5-5-5-5" />
          <path d="m13 17 5-5-5-5" />
        </>
      ) : (
        <>
          <path d="m11 17-5-5 5-5" />
          <path d="m18 17-5-5 5-5" />
        </>
      )}
    </svg>
  )
}

export default function AppLayout() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const location = useLocation()
  const [pending, setPending] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(APP_NAV_GROUPS.map((group) => [group.id, true])),
  )
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      APP_NAV_GROUPS.flatMap((group) => group.items)
        .filter((item) => item.children?.length)
        .map((item) => [item.to, location.pathname.startsWith(item.to)]),
    ),
  )
  const name = useMemo(() => displayName(auth), [auth])
  const user = auth?.user
  const navGroups = useMemo(
    () =>
      APP_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.permission || hasPermission(auth, item.permission)),
      })).filter((group) => group.items.length > 0),
    [auth],
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 960px)')

    function syncLayout() {
      if (media.matches) {
        setCollapsed(false)
      } else {
        setMobileNavOpen(false)
      }
    }

    media.addEventListener('change', syncLayout)
    return () => media.removeEventListener('change', syncLayout)
  }, [])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) {
      return undefined
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileNavOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileNavOpen])

  useEffect(() => {
    setOpenMenus((current) => {
      const next = { ...current }
      for (const group of APP_NAV_GROUPS) {
        for (const item of group.items) {
          if (item.children?.length && location.pathname.startsWith(item.to)) {
            next[item.to] = true
          }
        }
      }
      return next
    })
  }, [location.pathname])

  async function handleLogout() {
    setPending(true)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  function toggleGroup(id: string) {
    setOpenGroups((current) => ({ ...current, [id]: !current[id] }))
  }

  function toggleMenu(path: string) {
    setOpenMenus((current) => ({ ...current, [path]: !current[path] }))
  }

  function renderNavItem(item: NavItem) {
    const children = item.children?.filter((child) => !child.permission || hasPermission(auth, child.permission))
    if (!children?.length) {
      return (
        <NavLink key={item.to} to={item.to} className="nav-link" title={item.label}>
          <NavIcon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      )
    }

    const childActive = children.some(
      (child) => location.pathname === child.to || location.pathname.startsWith(`${child.to}/`),
    )
    const isOpen = collapsed || openMenus[item.to]

    if (collapsed) {
      return (
        <NavLink
          key={item.to}
          to={children[0].to}
          className={({ isActive }) => `nav-link${isActive || childActive ? ' active' : ''}`}
          title={item.label}
        >
          <NavIcon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      )
    }

    return (
      <div key={item.to} className="nav-branch">
        <button
          type="button"
          className={`nav-link nav-link-toggle${childActive ? ' is-current' : ''}${isOpen ? ' is-open' : ''}`}
          aria-expanded={isOpen}
          onClick={() => toggleMenu(item.to)}
        >
          <NavIcon name={item.icon} />
          <span>{item.label}</span>
          <HugeiconsIcon
            className="nav-chevron"
            icon={ArrowRight01Icon}
            size={12}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
        <div className={`nav-collapse${isOpen ? ' is-open' : ''}`}>
          <div className="nav-collapse-inner">
            {children.map((child) => (
              <NavLink key={child.to} to={child.to} className="nav-link nav-link-sub" title={child.label}>
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <PageLoader />
  }

  return (
    <div
      className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}${mobileNavOpen ? ' mobile-nav-open' : ''}`}
    >
      <header className="app-header">
        <div className="header-brand">
          <button
            type="button"
            className="nav-toggle"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <HugeiconsIcon
              icon={mobileNavOpen ? Cancel01Icon : Menu01Icon}
              size={20}
              color="currentColor"
              strokeWidth={1.5}
            />
          </button>
          <span className="brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 7L9 5l-3 7H2" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>EduConsult</strong>
            <small>CRM</small>
          </span>
        </div>

        <div className="header-main">
          <button
            type="button"
            className="sidebar-collapse"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((value) => !value)}
          >
            <ChevronsIcon direction={collapsed ? 'right' : 'left'} />
          </button>

          <GlobalSearch auth={auth} />

          <div className="topbar-actions">
            <ThemeToggle />
            <button type="button" className="icon-btn" aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <i className="notify-dot" />
            </button>

            <UserDropdown auth={auth} displayName={name} />
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside className="sidebar">
        <nav className="sidebar-nav" aria-label="Application">
          {navGroups.map((group) => {
            const isOpen = collapsed || openGroups[group.id]

            return (
              <section key={group.id} className="nav-group">
                <button
                  type="button"
                  className={`nav-group-title${isOpen ? ' is-open' : ''}`}
                  aria-expanded={isOpen}
                  onClick={() => !collapsed && toggleGroup(group.id)}
                >
                  <span>{group.label}</span>
                  <HugeiconsIcon
                    className="nav-chevron"
                    icon={ArrowRight01Icon}
                    size={12}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                </button>

                <div className={`nav-collapse${isOpen ? ' is-open' : ''}`}>
                  <div className="nav-collapse-inner nav-group-items">
                    {group.items.map((item) => renderNavItem(item))}
                  </div>
                </div>
              </section>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout"
            onClick={() => void handleLogout()}
            disabled={pending}
            title="Logout"
          >
            <HugeiconsIcon icon={Logout03Icon} size={18} color="currentColor" strokeWidth={1.5} />
            <span>{pending ? 'Signing out…' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      <main className="app-content">
        <Outlet context={auth} />
      </main>
    </div>
  )
}
