import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLazyGlobalSearchQuery } from '@/redux/features/search/searchApi'
import { APP_NAV_GROUPS, flattenSearchablePages, type NavItem } from '../config/navigation'
import { hasPermission } from '../lib/access'
import type { AuthSession, GlobalSearchHit } from '../types'

const GROUP_ORDER = ['Pages', 'Users', 'Employees', 'Roles', 'Master Data', 'Activity', 'Audit Log', 'Account']

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
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="rounded-sm bg-primary/22 p-0 text-inherit">
            {part}
          </mark>
        ) : (
          part
        ),
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
  const [triggerGlobalSearch] = useLazyGlobalSearchQuery()
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

    let request: ReturnType<typeof triggerGlobalSearch> | undefined
    const timer = window.setTimeout(() => {
      const current = ++requestId.current
      setLoading(true)
      request = triggerGlobalSearch(needle)
      void request
        .unwrap()
        .then((data) => {
          if (current !== requestId.current) {
            return
          }
          setRecords(data.results)
        })
        .catch((error: unknown) => {
          if ((error as { name?: string }).name === 'AbortError') {
            return
          }
          if (current === requestId.current) {
            setRecords([])
          }
        })
        .finally(() => {
          if (current === requestId.current) {
            setLoading(false)
          }
        })
    }, 220)

    return () => {
      window.clearTimeout(timer)
      request?.abort()
    }
  }, [open, query, triggerGlobalSearch])

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
    <div
      ref={rootRef}
      className={[
        'relative flex w-full min-w-[180px] max-w-search flex-[1_1_280px] items-center gap-2.5 rounded-search border border-search-border bg-search-bg px-3 text-text-muted shadow-soft',
        'max-[1100px]:min-w-0 max-[960px]:order-3 max-[960px]:mx-4 max-[960px]:mb-3 max-[960px]:w-auto max-[960px]:min-w-0 max-[960px]:max-w-none max-[960px]:flex-[1_1_100%] max-[640px]:mx-3 max-[640px]:mb-3',
        open
          ? 'border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-search-border))] shadow-[0_10px_28px_rgb(22_50_79_/_0.08)]'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="sr-only">Search</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3-3" />
      </svg>
      <input
        ref={inputRef}
        className="header-search-input m-0 w-full border-0 bg-transparent py-2.5 text-text outline-none placeholder:text-text-faint focus:outline-none"
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
      <kbd className="rounded-[calc(var(--radius-search)-4px)] border border-header-border bg-page-bg px-2 py-0.5 text-[0.72rem] whitespace-nowrap max-[960px]:hidden">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>

      {showPanel ? (
        <div
          id="global-search-results"
          className="absolute top-[calc(100%+8px)] right-0 left-0 z-60 max-h-[min(70vh,520px)] overflow-auto rounded-[14px] border border-card-border bg-surface py-1 shadow-card"
          role="listbox"
        >
          {loading ? <p className="m-0 px-3.5 py-2.5 text-[0.82rem] text-text-muted">Searching…</p> : null}
          {!loading && query.trim() && results.length === 0 ? (
            <p className="m-0 px-3.5 py-2.5 text-[0.82rem] text-text-muted">No matches for “{query.trim()}”.</p>
          ) : null}
          {grouped.map((section, sectionIndex) => {
            const offset = grouped.slice(0, sectionIndex).reduce((sum, item) => sum + item.items.length, 0)
            return (
              <section key={section.group}>
                <h3 className="mx-3.5 mt-1 mb-1.5 text-[0.68rem] font-bold tracking-[0.08em] text-text-faint uppercase">
                  {section.group}
                </h3>
                {section.items.map((hit, itemIndex) => {
                  const index = offset + itemIndex
                  const active = index === activeIndex
                  return (
                    <button
                      key={hit.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={[
                        'flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-3.5 py-2 text-left text-text',
                        active ? 'bg-hover-bg' : 'hover:bg-hover-bg',
                      ].join(' ')}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(hit)}
                    >
                      <span className="grid min-w-0 gap-0.5">
                        <strong className="overflow-hidden text-[0.9rem] font-semibold text-ellipsis whitespace-nowrap text-text-strong">
                          <Highlight text={hit.title} query={query} />
                        </strong>
                        {hit.subtitle ? (
                          <small className="overflow-hidden text-[0.75rem] text-ellipsis whitespace-nowrap text-text-muted">
                            <Highlight text={hit.subtitle} query={query} />
                          </small>
                        ) : null}
                      </span>
                      <em className="shrink-0 text-[0.7rem] text-text-faint not-italic">
                        {hit.type === 'page' ? 'Page' : hit.group}
                      </em>
                    </button>
                  )
                })}
              </section>
            )
          })}
          <p className="m-0 border-t border-border-subtle px-3.5 py-2.5 text-[0.72rem] text-text-faint">
            ↑↓ to move · Enter to open · Esc to close
          </p>
        </div>
      ) : null}
    </div>
  )
}
