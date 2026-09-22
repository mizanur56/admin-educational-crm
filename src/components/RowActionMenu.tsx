import { rowActionBtn, rowActionMenu, rowActionMenuItem, rowActionMenuItemDanger } from '../styles/admin'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { MoreVerticalIcon } from '@hugeicons/core-free-icons'

export type RowActionItem = {
  key: string
  label: string
  icon: ReactNode
  danger?: boolean
  onSelect: () => void
}

const MENU_WIDTH = 200
const MENU_GAP = 6
const VIEWPORT_PAD = 8

export default function RowActionMenu({ items }: { items: RowActionItem[] }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  function placeMenu() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }

    const estimatedHeight = items.length * 40 + 12
    const menuHeight = menuRef.current?.offsetHeight || estimatedHeight
    const left = Math.min(
      Math.max(VIEWPORT_PAD, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - VIEWPORT_PAD,
    )

    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_PAD
    const spaceAbove = rect.top - MENU_GAP - VIEWPORT_PAD
    const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow

    let top = openUp ? rect.top - menuHeight - MENU_GAP : rect.bottom + MENU_GAP
    const maxTop = Math.max(VIEWPORT_PAD, window.innerHeight - menuHeight - VIEWPORT_PAD)
    top = Math.min(Math.max(VIEWPORT_PAD, top), maxTop)

    setCoords({ top, left })
  }

  useLayoutEffect(() => {
    if (!open) {
      return
    }
    placeMenu()
  }, [open, items.length])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    function onReposition() {
      placeMenu()
    }

    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, items.length])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`${rowActionBtn} ui-btn ui-btn-ghost ui-btn-sm`}
        title="Actions"
        aria-label="Actions"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          if (open) {
            setOpen(false)
            return
          }
          setOpen(true)
        }}
      >
        <span className="ui-btn-icon">
          <HugeiconsIcon icon={MoreVerticalIcon} size={16} color="currentColor" strokeWidth={1.5} />
        </span>
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className={`${rowActionMenu}`}
              style={{ top: coords.top, left: coords.left }}
              role="menu"
            >
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className={item.danger ? rowActionMenuItemDanger : rowActionMenuItem}
                  onClick={() => {
                    setOpen(false)
                    item.onSelect()
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
