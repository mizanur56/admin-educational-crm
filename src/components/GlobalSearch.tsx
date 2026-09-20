import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { globalSearch } from '../api/client'
import { APP_NAV_GROUPS, flattenSearchablePages, type NavItem } from '../config/navigation'
import { hasPermission } from '../lib/access'
import type { AuthSession, GlobalSearchHit } from '../types'

const GROUP_ORDER = ['Pages', 'Leads', 'Users', 'Employees', 'Roles', 'Master Data', 'Activity', 'Audit Log', 'Account']

type Props = {
  auth: AuthSession
}

function isMacPlatform() {
  if (typeof navigator === 'undefined') {
    return false
  }
  return /mac/i.test(navigator.platform || navigator.userAgent)
}

function collectPermissions(items: NavItem[]): Array<{ to: string; permission?: string }> {
  return items.flatMap((item) => [
    { to: item.to, permission: item.permission },
    ...(item.children ? collectPermissions(item.children) : []),
  ])
}

function pageMatches(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query.toLowerCase())
}

function rankText(text: string, query: string) {
  const value = text.toLowerCase()
  const needle = query.toLowerCase()
  if (value === needle) {
    return 0
  }
  if (value.startsWith(needle)) {
    return 1
  }
  if (value.includes(needle)) {
    return 2
  }
  return 4
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <>{text}</>
  }
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'))
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? <mark key={`${part}-${index}`}>{part}</mark> : part,
      )}
    </>
  )
}

export default function GlobalSearch({ auth }: Props) {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [records, setRecords] = useState<GlobalSearchHit[]>([])
  const [isMac, setIsMac] = useState(false)
  const requestId = useRef(0)
  const permissionIndex = useMemo(
    () => collectPermissions(APP_NAV_GROUPS.flatMap((group) => group.items)),
    [],
  )

  const pages = useMemo(
    () =>
      flattenSearchablePages().filter((page) => {
        if (page.to === '/profile' || page.to === '/account') {
          return true
        }
        const exact = permissionIndex.find((item) => item.to === page.to)
        const parent = permissionIndex.find((item) => item.to !== '/' && (page.to === item.to || page.to.startsWith(`${item.to}/`)))
        const required = exact?.permission || parent?.permission
        return !required || hasPermission(auth, required)
      }),
    [auth, permissionIndex],
  )

  const pageHits = useMemo(() => {
    const needle = query.trim()
    const matched = needle
      ? pages.filter((page) =>
          pageMatches(`${page.label} ${page.group} ${page.to} ${page.keywords.join(' ')}`, needle),
        )
      : pages.filter((page) => page.group !== 'Account').slice(0, 8)

    return matched
      .map((page) => ({
        id: `page:${page.to}`,
        type: 'page' as const,
        title: page.label,
        subtitle: page.group,
        href: page.to,
        group: 'Pages',
        rank: needle ? Math.min(rankText(page.label, needle), ...page.keywords.map((word) => rankText(word, needle))) : 3,
      }))
      .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))
      .slice(0, 8)
      .map(({ rank: _rank, ...hit }) => hit)
  }, [pages, query])

  const results = useMemo(() => {
    const needle = query.trim()
    if (!needle) {
      return pageHits
    }
    return [...pageHits, ...records]
  }, [pageHits, query, records])

  const grouped = useMemo(() => {
    const map = new Map<string, GlobalSearchHit[]>()
    for (const hit of results) {
      const list = map.get(hit.group) || []
      list.push(hit)
      map.set(hit.group, list)
    }
    return GROUP_ORDER.filter((group) => map.has(group)).map((group) => ({
      group,
      items: map.get(group) || [],
    }))
  }, [results])

  useEffect(() => {
    setIsMac(isMacPlatform())
  }, [])

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    function onShortcut(event: globalThis.KeyboardEvent) {
      const key = event.key.toLowerCase()
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault()
        setOpen(true)
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  useEffect(() => {
    const needle = query.trim()
    if (!open || needle.length < 1) {
      setRecords([])
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      const current = ++requestId.current
      setLoading(true)
      try {
        const result = await globalSearch(needle, controller.signal)
        if (current !== requestId.current) {
          return
        }
        setRecords(result.ok ? result.data.results : [])
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') {
          return
        }
        if (current === requestId.current) {
          setRecords([])
        }
      } finally {
        if (current === requestId.current) {
          setLoading(false)
        }
      }
    }, 220)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [open, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [results.length, query])

  function goTo(hit: GlobalSearchHit) {
    setOpen(false)
    setQuery('')
    setRecords([])
    navigate(hit.href)
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const hit = results[activeIndex]
      if (hit) {
        goTo(hit)
      }
    }
  }

  const showPanel = open && (query.trim().length > 0 || pageHits.length > 0)

  return (
    <div ref={rootRef} className={`top-search${open ? ' is-open' : ''}`}>
      <span className="sr-only">Search</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3-3" />
      </svg>
      <input
        ref={inputRef}
        className="header-search-input"
        value={query}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="global-search-results"
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search anything..."
      />
      <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>

      {showPanel ? (
        <div id="global-search-results" className="global-search-panel" role="listbox">
          {loading ? <p className="global-search-status">Searching…</p> : null}
          {!loading && query.trim() && results.length === 0 ? (
            <p className="global-search-status">No matches for “{query.trim()}”.</p>
          ) : null}
          {grouped.map((section, sectionIndex) => {
            const offset = grouped.slice(0, sectionIndex).reduce((sum, item) => sum + item.items.length, 0)
            return (
              <section key={section.group} className="global-search-group">
                <h3>{section.group}</h3>
                {section.items.map((hit, itemIndex) => {
                  const index = offset + itemIndex
                  return (
                    <button
                      key={hit.id}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`global-search-item${index === activeIndex ? ' is-active' : ''}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(hit)}
                    >
                      <span className="global-search-item-copy">
                        <strong>
                          <Highlight text={hit.title} query={query} />
                        </strong>
                        {hit.subtitle ? (
                          <small>
                            <Highlight text={hit.subtitle} query={query} />
                          </small>
                        ) : null}
                      </span>
                      <em>{hit.type === 'page' ? 'Page' : hit.group}</em>
                    </button>
                  )
                })}
              </section>
            )
          })}
          <p className="global-search-hint">↑↓ to move · Enter to open · Esc to close</p>
        </div>
      ) : null}
    </div>
  )
}
