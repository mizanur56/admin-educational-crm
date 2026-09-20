import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, Navigate, NavLink, useLocation, useOutletContext, useParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  AddCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  File01Icon,
  HashtagIcon,
  HistoryIcon,
  Key01Icon,
  Link01Icon,
  MoreVerticalIcon,
  Note01Icon,
  PencilEdit02Icon,
  TextIcon,
  UserIcon,
  UserPlusIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { DatePicker, Spin, Switch } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import PageHeader from '../components/PageHeader'
import {
  createMasterDataItem,
  deleteMasterDataItem,
  exportMasterData,
  importMasterData,
  listMasterDataCategories,
  listMasterDataHistory,
  listMasterDataItems,
  listMasterDataOptions,
  updateMasterDataItem,
} from '../api/client'
import { hasPermission } from '../lib/access'
import { getMasterDataGroupByCategory, getMasterDataNavGroup } from '../config/masterData'
import { readUrlSearchQuery } from '../lib/url-search'
import type {
  AuthSession,
  MasterDataCategory,
  MasterDataHistory,
  MasterDataImportResult,
  MasterDataItem,
  RecordStatus,
} from '../types'
import './admin.css'

type FormMode = 'create' | 'edit'
type ToastState = { text: string; type: 'success' | 'error' }

const DESCRIPTION_MAX = 100

type RowActionItem = {
  key: string
  label: string
  icon: ReactNode
  danger?: boolean
  onSelect: () => void
}

function ActionIcon({ icon }: { icon: IconSvgElement }) {
  return <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.5} />
}

function RowActionMenu({ items }: { items: RowActionItem[] }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  function placeMenu() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }
    const width = 200
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
    setCoords({ top: rect.bottom + 6, left })
  }

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
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="row-action-btn ui-btn ui-btn-ghost ui-btn-sm"
        title="Actions"
        aria-label="Actions"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          if (open) {
            setOpen(false)
            return
          }
          placeMenu()
          setOpen(true)
        }}
      >
        <span className="ui-btn-icon">
          <ActionIcon icon={MoreVerticalIcon} />
        </span>
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="row-action-menu"
              style={{ top: coords.top, left: coords.left }}
              role="menu"
            >
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className={item.danger ? 'is-danger' : undefined}
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

type ItemForm = {
  name: string
  code: string
  description: string
  status: RecordStatus
  parentId: string
  behaviorKey: string
  startDate: string
  endDate: string
}

const EMPTY_FORM: ItemForm = {
  name: '',
  code: '',
  description: '',
  status: 'ACTIVE',
  parentId: '',
  behaviorKey: '',
  startDate: '',
  endDate: '',
}

function extraText(extras: Record<string, unknown> | null, key: string) {
  const value = extras?.[key]
  return typeof value === 'string' ? value : ''
}

function formFromItem(item: MasterDataItem): ItemForm {
  return {
    name: item.name,
    code: item.code || '',
    description: (item.description || '').slice(0, DESCRIPTION_MAX),
    status: item.status,
    parentId: item.parentId || '',
    behaviorKey: item.behaviorKey || '',
    startDate: extraText(item.extras, 'startDate'),
    endDate: extraText(item.extras, 'endDate'),
  }
}

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function toDayjs(value: string) {
  return value ? dayjs(value) : null
}

function toDateString(value: Dayjs | null) {
  return value ? value.format('YYYY-MM-DD') : ''
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className={required ? 'field-label is-required' : 'field-label'}>{children}</span>
  )
}

function parentCategoryName(parentCategoryKey?: string) {
  if (!parentCategoryKey) {
    return 'Parent'
  }
  const group = getMasterDataGroupByCategory(parentCategoryKey)
  return group?.categories.find((item) => item.key === parentCategoryKey)?.name || 'Parent'
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

type HistoryKind = 'updated' | 'created' | 'status' | 'assigned' | 'deleted'

type HistoryChangeRow = {
  key: string
  label: string
  from: string
  to: string
}

function formatHistoryDate(value: string | Date) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

function displayHistoryValue(value: unknown) {
  if (value == null || value === '') {
    return '—'
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}

function humanizeField(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function fieldIcon(key: string): IconSvgElement {
  const normalized = key.toLowerCase()
  if (normalized.includes('name')) {
    return TextIcon
  }
  if (normalized.includes('code') || (normalized.includes('key') && !normalized.includes('category'))) {
    return HashtagIcon
  }
  if (normalized.includes('category')) {
    return Key01Icon
  }
  if (normalized.includes('parent') || normalized.includes('link')) {
    return Link01Icon
  }
  if (normalized.includes('status')) {
    return CheckmarkCircle02Icon
  }
  if (normalized.includes('user') || normalized.includes('assign')) {
    return UserIcon
  }
  return File01Icon
}

function parseHistoryMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { fields: {} as Record<string, unknown>, changes: {} as Record<string, { from?: unknown; to?: unknown }>, notes: '' }
  }
  const record = metadata as Record<string, unknown>
  const rawChanges = record.changes
  const changes: Record<string, { from?: unknown; to?: unknown }> = {}
  if (rawChanges && typeof rawChanges === 'object' && !Array.isArray(rawChanges)) {
    for (const [key, value] of Object.entries(rawChanges as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && ('from' in value || 'to' in value)) {
        const pair = value as { from?: unknown; to?: unknown }
        changes[key] = { from: pair.from, to: pair.to }
      } else {
        changes[key] = { to: value }
      }
    }
  }
  const notes = typeof record.notes === 'string' ? record.notes : typeof record.note === 'string' ? record.note : ''
  const fields: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (key !== 'changes' && key !== 'notes' && key !== 'note') {
      fields[key] = value
    }
  }
  return { fields, changes, notes }
}

function historyKind(action: string, changes: Record<string, { from?: unknown; to?: unknown }>): HistoryKind {
  if (action.includes('CREATED')) {
    return 'created'
  }
  if (action.includes('DELETED')) {
    return 'deleted'
  }
  if (action.includes('ACTIVATED') || action.includes('DEACTIVATED') || 'status' in changes) {
    return 'status'
  }
  const keys = Object.keys(changes)
  if (keys.length > 0 && keys.every((key) => key === 'parent' || key === 'parentId' || key === 'assignedTo')) {
    return 'assigned'
  }
  return 'updated'
}

function historyTitle(kind: HistoryKind) {
  if (kind === 'created') {
    return 'Created'
  }
  if (kind === 'deleted') {
    return 'Deleted'
  }
  if (kind === 'status') {
    return 'Status Changed'
  }
  if (kind === 'assigned') {
    return 'Assigned'
  }
  return 'Updated'
}

function historyKindIcon(kind: HistoryKind): IconSvgElement {
  if (kind === 'created') {
    return AddCircleIcon
  }
  if (kind === 'deleted') {
    return Delete02Icon
  }
  if (kind === 'status') {
    return CheckmarkCircle02Icon
  }
  if (kind === 'assigned') {
    return UserPlusIcon
  }
  return PencilEdit02Icon
}

function historyChangeRows(action: string, metadata: unknown): HistoryChangeRow[] {
  const parsed = parseHistoryMetadata(metadata)
  const rows: HistoryChangeRow[] = []
  const seen = new Set<string>()

  for (const [key, pair] of Object.entries(parsed.changes)) {
    seen.add(key)
    rows.push({
      key,
      label: humanizeField(key),
      from: displayHistoryValue(pair.from),
      to: displayHistoryValue(pair.to),
    })
  }

  if (rows.length === 0) {
    for (const key of ['name', 'code', 'categoryKey', 'status', 'parent']) {
      if (key in parsed.fields && !seen.has(key)) {
        rows.push({
          key,
          label: humanizeField(key),
          from: action.includes('DELETED') ? displayHistoryValue(parsed.fields[key]) : '—',
          to: action.includes('DELETED') ? '—' : displayHistoryValue(parsed.fields[key]),
        })
      }
    }
  }

  return rows
}

function HistoryFieldList({
  title,
  rows,
  valueKey,
}: {
  title: string
  rows: HistoryChangeRow[]
  valueKey: 'from' | 'to'
}) {
  const showHead = valueKey === 'to'
  return (
    <section className="md-history-card">
      <h4>{title}</h4>
      <div className="md-history-table">
        {showHead ? (
          <div className="md-history-table-head">
            <span>Field</span>
            <span>New Value</span>
          </div>
        ) : null}
        {rows.length === 0 ? (
          <p className="md-history-empty-row">No field changes recorded.</p>
        ) : (
          rows.map((row) => (
            <div key={`${title}-${row.key}`} className="md-history-table-row">
              <span>
                <HugeiconsIcon icon={fieldIcon(row.key)} size={14} color="currentColor" strokeWidth={1.5} />
                {row.label}
              </span>
              <strong>{row[valueKey]}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default function MasterDataItems() {
  const auth = useOutletContext<AuthSession>()
  const location = useLocation()
  const { groupSlug = '', categoryKey: categoryParam } = useParams()
  const navGroup = getMasterDataNavGroup(groupSlug)
  const categoryKey = categoryParam || navGroup?.categories[0]?.key || ''
  const canCreate = hasPermission(auth, 'master_data:create')
  const canEdit = hasPermission(auth, 'master_data:edit')
  const canDelete = hasPermission(auth, 'master_data:delete')
  const fileRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<MasterDataCategory | null>(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [items, setItems] = useState<MasterDataItem[]>([])
  const [parents, setParents] = useState<Array<{ id: string; name: string }>>([])
  const [parentsLoading, setParentsLoading] = useState(false)
  const parentsRequest = useRef(0)
  const [search, setSearch] = useState(() => readUrlSearchQuery(location.search))
  const [status, setStatus] = useState('')
  const [parentId, setParentId] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [sortBy, setSortBy] = useState('sortOrder')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const historyRequest = useRef(0)
  const [importOpen, setImportOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selected, setSelected] = useState<MasterDataItem | null>(null)
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM)
  const [history, setHistory] = useState<MasterDataHistory[]>([])
  const [historyEntryId, setHistoryEntryId] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<MasterDataImportResult | null>(null)
  const [formSaving, setFormSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MasterDataItem | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncedSearch = useRef(false)
  const entityName = category?.name || 'Master data'

  function showToast(text: string, type: ToastState['type'] = 'success') {
    setToast({ text, type })
    if (toastTimer.current) {
      clearTimeout(toastTimer.current)
    }
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  async function loadParents(parentCategoryKey?: string) {
    const requestId = ++parentsRequest.current
    if (!parentCategoryKey) {
      setParents([])
      setParentsLoading(false)
      return
    }
    setParentsLoading(true)
    try {
      const options = await listMasterDataOptions(parentCategoryKey)
      if (requestId !== parentsRequest.current) {
        return
      }
      setParents(options.ok ? options.data.items : [])
    } finally {
      if (requestId === parentsRequest.current) {
        setParentsLoading(false)
      }
    }
  }

  async function loadCategory() {
    setMetaLoading(true)
    setParents([])
    const result = await listMasterDataCategories()
    if (!result.ok) {
      showToast(result.data?.error || 'You are not authorized to manage master data.', 'error')
      setMetaLoading(false)
      setParentsLoading(false)
      return
    }
    const match = result.data.groups.flatMap((group) => group.categories).find((item) => item.key === categoryKey)
    if (match?.parentCategoryKey) {
      setParentsLoading(true)
    } else {
      setParentsLoading(false)
    }
    setCategory(match || null)
    await loadParents(match?.parentCategoryKey)
    setMetaLoading(false)
  }

  async function loadItems(fromSearch = false, searchValue = search) {
    if (fromSearch) {
      setSearching(true)
    }
    setLoading(true)
    try {
      const result = await listMasterDataItems({
        category: categoryKey,
        search: searchValue,
        status,
        parentId,
        createdFrom,
        createdTo,
        sortBy,
        sortDir: 'asc',
      })
      if (result.ok) {
        setItems(result.data.items)
      } else {
        showToast(result.data?.error || 'Unable to process the request. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  useEffect(() => {
    void loadCategory()
    setSearch(readUrlSearchQuery(location.search))
    setStatus('')
    setParentId('')
    setCreatedFrom('')
    setCreatedTo('')
    setFormOpen(false)
  }, [categoryKey])

  useEffect(() => {
    if (categoryKey) {
      void loadItems(false, readUrlSearchQuery(location.search) || search)
    }
  }, [categoryKey, status, parentId, createdFrom, createdTo, sortBy])

  useEffect(() => {
    const next = readUrlSearchQuery(location.search)
    setSearch(next)
    if (syncedSearch.current && categoryKey) {
      void loadItems(Boolean(next), next)
    }
    syncedSearch.current = true
  }, [location.search])

  useEffect(
    () => () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current)
      }
    },
    [],
  )

  const filteredParents = useMemo(() => {
    if (form.parentId && !parents.some((item) => item.id === form.parentId) && selected?.parentName) {
      return [{ id: form.parentId, name: selected.parentName }, ...parents]
    }
    return parents
  }, [form.parentId, parents, selected])

  function openCreate() {
    setSelected(null)
    setForm({ ...EMPTY_FORM, parentId })
    setFormMode('create')
    setFormSaving(false)
    setFormOpen(true)
    if (category?.parentCategoryKey) {
      void loadParents(category.parentCategoryKey)
    }
  }

  function openItem(item: MasterDataItem, mode: FormMode) {
    setSelected(item)
    setForm(formFromItem(item))
    setFormMode(mode)
    setFormSaving(false)
    setFormOpen(true)
    if (category?.parentCategoryKey) {
      void loadParents(category.parentCategoryKey)
    }
  }

  async function openHistory(item: MasterDataItem) {
    const requestId = ++historyRequest.current
    setSelected(item)
    setHistory([])
    setHistoryEntryId(null)
    setHistoryLoading(true)
    setHistoryOpen(true)
    const result = await listMasterDataHistory(item.id, categoryKey)
    if (requestId !== historyRequest.current) {
      return
    }
    setHistoryLoading(false)
    if (!result.ok) {
      showToast(result.data?.error || 'Unable to load history.', 'error')
      return
    }
    setHistory(result.data.history)
    setHistoryEntryId(result.data.history[0]?.id ?? null)
  }

  function closeHistory() {
    historyRequest.current += 1
    setHistoryOpen(false)
    setHistoryLoading(false)
    setHistoryEntryId(null)
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (formSaving) {
      return
    }
    if (!form.name.trim()) {
      showToast('Name is required.', 'error')
      return
    }
    if (category?.codePolicy === 'required' && !form.code.trim()) {
      showToast('Please enter a valid unique code.', 'error')
      return
    }
    if (category?.parentCategoryKey && (parentsLoading || !form.parentId)) {
      showToast(
        parentsLoading
          ? `${parentCategoryName(category.parentCategoryKey)} options are still loading.`
          : 'Selected parent value is not available.',
        'error',
      )
      return
    }
    if (form.description.length > DESCRIPTION_MAX) {
      showToast(`Description cannot exceed ${DESCRIPTION_MAX} characters.`, 'error')
      return
    }
    const payload = {
      categoryKey,
      name: form.name,
      code: form.code,
      description: form.description.slice(0, DESCRIPTION_MAX),
      status: form.status,
      sortOrder: selected?.sortOrder ?? 0,
      parentId: form.parentId || null,
      behaviorKey: form.behaviorKey || null,
      startDate: form.startDate,
      endDate: form.endDate,
    }
    setFormSaving(true)
    try {
      const result = selected ? await updateMasterDataItem(selected.id, payload) : await createMasterDataItem(payload)
      if (!result.ok) {
        showToast(result.data?.error || 'Unable to process the request. Please try again.', 'error')
        return
      }
      showToast(`${entityName} successfully ${selected ? 'updated' : 'created'}.`)
      setFormOpen(false)
      await loadItems()
    } finally {
      setFormSaving(false)
    }
  }

  async function setItemStatus(item: MasterDataItem, next: RecordStatus) {
    if (statusUpdatingId) {
      return
    }
    setStatusUpdatingId(item.id)
    try {
      const result = await updateMasterDataItem(item.id, {
        categoryKey,
        name: item.name,
        code: item.code || '',
        description: item.description || '',
        status: next,
        sortOrder: item.sortOrder,
        parentId: item.parentId,
        behaviorKey: item.behaviorKey,
        startDate: extraText(item.extras, 'startDate'),
        endDate: extraText(item.extras, 'endDate'),
      })
      if (!result.ok) {
        showToast(result.data?.error || 'Unable to process the request. Please try again.', 'error')
        return
      }
      showToast(`${entityName} successfully ${next === 'ACTIVE' ? 'activated' : 'deactivated'}.`)
      await loadItems()
    } finally {
      setStatusUpdatingId(null)
    }
  }

  function askDelete(item: MasterDataItem) {
    setDeleteTarget(item)
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteSaving) {
      return
    }
    setDeleteSaving(true)
    try {
      const result = await deleteMasterDataItem(deleteTarget.id, categoryKey)
      if (!result.ok) {
        showToast(
          result.data?.error || 'This value is already being used and cannot be deleted.',
          'error',
        )
        return
      }
      showToast(`${entityName} successfully deleted.`)
      setDeleteTarget(null)
      await loadItems()
    } finally {
      setDeleteSaving(false)
    }
  }

  async function handleExport(format: 'csv' | 'xlsx') {
    const result = await exportMasterData(categoryKey, format)
    if (!result.ok) {
      showToast(result.data?.error || 'Unable to process the request. Please try again.', 'error')
      return
    }
    downloadBlob(result.data.blob, result.data.fileName)
    showToast(`Exported ${category?.name || 'master data'}.`)
  }

  async function handleImport(file: File) {
    const result = await importMasterData(categoryKey, file)
    if (!result.ok) {
      showToast(result.data?.error || 'Unable to import the selected data.', 'error')
      return
    }
    setImportResult(result.data)
    setImportOpen(true)
    showToast(`Imported ${result.data.successful} of ${result.data.total} records.`)
    await loadItems()
  }

  function downloadErrors() {
    if (!importResult) {
      return
    }
    const lines = ['Row,Message', ...importResult.errors.map((item) => `${item.row},"${item.message.replace(/"/g, '""')}"`)]
    downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv' }), `${categoryKey.toLowerCase()}-import-errors.csv`)
  }

  if (!navGroup) {
    const mapped = getMasterDataGroupByCategory(groupSlug)
    if (mapped) {
      return <Navigate to={`/master-data/${mapped.slug}/${groupSlug}`} replace />
    }
    return (
      <div className="admin-page">
        <PageHeader title="Master Data" description="Category not found." />
        <Link to="/master-data">Back to Master Data</Link>
      </div>
    )
  }

  if (!categoryParam || !navGroup.categories.some((item) => item.key === categoryParam)) {
    return <Navigate to={`/master-data/${navGroup.slug}/${navGroup.categories[0].key}`} replace />
  }

  if (!category && !metaLoading) {
    return (
      <div className="admin-page">
        <PageHeader title="Master Data" description="Category not found." />
        <Link to="/master-data">Back to categories</Link>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <PageHeader
        title={navGroup.name}
        description={category ? `Manage ${category.name} values.` : 'Create, edit, activate, and import reusable reference values.'}
      >
        {canCreate ? <Button onClick={openCreate}>Add New</Button> : null}
      </PageHeader>

      <nav className="md-tabs" aria-label="Master data categories">
        {navGroup.categories.map((tab) => (
          <NavLink
            key={tab.key}
            to={`/master-data/${navGroup.slug}/${tab.key}`}
            className={({ isActive }) => `md-tab${isActive ? ' is-active' : ''}`}
          >
            {tab.name}
          </NavLink>
        ))}
      </nav>

      <section className="admin-filters admin-filters-master">
        <Input.Search
          allowClear
          enterButton="Search"
          loading={searching}
          placeholder="Search name or code"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={() => {
            void loadItems(true)
          }}
        />
        <Select
          allowClear
          placeholder="All statuses"
          style={{ width: '100%' }}
          value={status || undefined}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
          ]}
          onChange={(value) => setStatus(asSelectString(value))}
        />
        {category?.parentCategoryKey ? (
          <Select
            allowClear
            loading={parentsLoading}
            style={{ width: '100%' }}
            placeholder={
              parentsLoading
                ? `Loading ${parentCategoryName(category.parentCategoryKey)}...`
                : `All ${parentCategoryName(category.parentCategoryKey)}`
            }
            value={parentId || undefined}
            options={parents.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(value) => setParentId(asSelectString(value))}
          />
        ) : null}
        <DatePicker
          allowClear
          placeholder="Start date"
          aria-label="Start date"
          style={{ width: '100%' }}
          value={toDayjs(createdFrom)}
          disabledDate={(current) => Boolean(createdTo && current.isAfter(dayjs(createdTo), 'day'))}
          onChange={(value) => setCreatedFrom(toDateString(value))}
        />
        <DatePicker
          allowClear
          placeholder="End date"
          aria-label="End date"
          style={{ width: '100%' }}
          value={toDayjs(createdTo)}
          disabledDate={(current) => Boolean(createdFrom && current.isBefore(dayjs(createdFrom), 'day'))}
          onChange={(value) => setCreatedTo(toDateString(value))}
        />
        <Select
          style={{ width: '100%' }}
          value={sortBy}
          options={[
            { value: 'sortOrder', label: 'Sort order' },
            { value: 'name', label: 'Name' },
            { value: 'code', label: 'Code' },
            { value: 'createdAt', label: 'Created date' },
            { value: 'status', label: 'Status' },
          ]}
          onChange={(value) => setSortBy(asSelectString(value) || 'sortOrder')}
        />
      </section>

      <div className="md-toolbar">
        <div className="md-toolbar-end">
          {canCreate ? (
            <>
              <input
                ref={fileRef}
                className="sr-only"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) {
                    void handleImport(file)
                  }
                }}
              />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Bulk Import
              </Button>
            </>
          ) : null}
          <Button variant="secondary" onClick={() => void handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => void handleExport('xlsx')}>
            Export Excel
          </Button>
        </div>
      </div>

      <section className="admin-card table-wrap">
        <Spin spinning={loading}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                {category?.parentCategoryKey ? <th>{parentCategoryName(category.parentCategoryKey)}</th> : null}
                <th>Status</th>
                <th>Sort</th>
                <th>Used by</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={category?.parentCategoryKey ? 7 : 6}>No master data found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.description ? <div className="muted">{item.description}</div> : null}
                    </td>
                    <td>{item.code || '—'}</td>
                    {category?.parentCategoryKey ? <td>{item.parentName || '—'}</td> : null}
                    <td>
                      <Switch
                        checked={item.status === 'ACTIVE'}
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                        disabled={!canEdit || item.isSystem}
                        loading={statusUpdatingId === item.id}
                        onChange={(checked) => {
                          void setItemStatus(item, checked ? 'ACTIVE' : 'INACTIVE')
                        }}
                      />
                    </td>
                    <td>{item.sortOrder}</td>
                    <td>{item.usageCount > 0 ? `Used by: ${item.usageCount}` : '—'}</td>
                    <td className="row-actions">
                      <RowActionMenu
                        items={(
                          [
                            {
                              key: 'history',
                              label: 'History',
                              icon: <ActionIcon icon={ViewIcon} />,
                              onSelect: () => {
                                void openHistory(item)
                              },
                            },
                            canEdit
                              ? {
                                  key: 'edit',
                                  label: 'Edit',
                                  icon: <ActionIcon icon={PencilEdit02Icon} />,
                                  onSelect: () => openItem(item, 'edit'),
                                }
                              : null,
                            canDelete && item.usageCount === 0 && !item.isSystem
                              ? {
                                  key: 'delete',
                                  label: 'Delete',
                                  icon: <ActionIcon icon={Delete02Icon} />,
                                  danger: true,
                                  onSelect: () => {
                                    askDelete(item)
                                  },
                                }
                              : null,
                          ] satisfies Array<RowActionItem | null>
                        ).filter((item) => item !== null)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Spin>
      </section>

      {formOpen
        ? createPortal(
            <div className="modal-backdrop" onClick={() => !formSaving && setFormOpen(false)}>
              <div
                className="modal-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="md-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <h3 id="md-modal-title">
                    {formMode === 'create' ? `Add ${category?.name || ''}` : `Edit ${category?.name || ''}`}
                  </h3>
                  <button
                    type="button"
                    className="modal-close"
                    aria-label="Close"
                    disabled={formSaving}
                    onClick={() => !formSaving && setFormOpen(false)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
                <form className="admin-form" onSubmit={(event) => void saveItem(event)}>
                  <fieldset className="admin-form-fields" disabled={formSaving}>
                    <label>
                      <FieldLabel required>Name</FieldLabel>
                      <Input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      <FieldLabel required={category?.codePolicy === 'required'}>Code</FieldLabel>
                      <Input
                        value={form.code}
                        onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                        disabled={Boolean(selected?.isSystem)}
                        required={category?.codePolicy === 'required'}
                        placeholder={category?.codePolicy === 'required' ? 'Required' : 'Recommended'}
                      />
                    </label>
                    {category?.parentCategoryKey ? (
                      <label>
                        <FieldLabel required>{parentCategoryName(category.parentCategoryKey)}</FieldLabel>
                        <Select
                          loading={parentsLoading}
                          placeholder={
                            parentsLoading
                              ? `Loading ${parentCategoryName(category.parentCategoryKey)}...`
                              : `Select ${parentCategoryName(category.parentCategoryKey)}`
                          }
                          value={form.parentId || undefined}
                          options={filteredParents.map((item) => ({ value: item.id, label: item.name }))}
                          onChange={(value) => setForm((current) => ({ ...current, parentId: asSelectString(value) }))}
                          disabled={parentsLoading}
                        />
                      </label>
                    ) : null}
                    <label>
                      Status
                      <Select
                        value={form.status}
                        options={[
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'INACTIVE', label: 'Inactive' },
                        ]}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            status: (asSelectString(value) || 'ACTIVE') as RecordStatus,
                          }))
                        }
                        disabled={Boolean(selected?.isSystem)}
                      />
                    </label>
                    {category?.extraFields === 'leadStatus' ? (
                      <label>
                        Behavior
                        <Select
                          allowClear
                          placeholder="No special behavior"
                          value={form.behaviorKey || undefined}
                          options={[
                            { value: 'converted', label: 'Converted process' },
                            { value: 'lost', label: 'Lost reason required' },
                            { value: 'closed', label: 'Closed' },
                          ]}
                          onChange={(value) => setForm((current) => ({ ...current, behaviorKey: asSelectString(value) }))}
                          disabled={Boolean(selected?.isSystem)}
                        />
                      </label>
                    ) : null}
                    {category?.extraFields === 'intake' ? (
                      <>
                        <label>
                          Start Date
                          <DatePicker
                            allowClear
                            format="YYYY-MM-DD"
                            placeholder="Select start date"
                            value={toDayjs(form.startDate)}
                            disabledDate={(current) =>
                              Boolean(form.endDate && current.isAfter(dayjs(form.endDate), 'day'))
                            }
                            onChange={(value) =>
                              setForm((current) => ({ ...current, startDate: toDateString(value) }))
                            }
                          />
                        </label>
                        <label>
                          End Date
                          <DatePicker
                            allowClear
                            format="YYYY-MM-DD"
                            placeholder="Select end date"
                            value={toDayjs(form.endDate)}
                            disabledDate={(current) =>
                              Boolean(form.startDate && current.isBefore(dayjs(form.startDate), 'day'))
                            }
                            onChange={(value) =>
                              setForm((current) => ({ ...current, endDate: toDateString(value) }))
                            }
                          />
                        </label>
                      </>
                    ) : null}
                    <label className="admin-form-span">
                      Description
                      <Input
                        value={form.description}
                        maxLength={DESCRIPTION_MAX}
                        showCount
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            description: event.target.value.slice(0, DESCRIPTION_MAX),
                          }))
                        }
                      />
                    </label>
                  </fieldset>
                  {selected && formMode !== 'create' ? (
                    <p className="muted">
                      Created {new Date(selected.createdAt).toLocaleString()}
                      {selected.createdBy ? ` by ${selected.createdBy.fullName}` : ''}
                      {selected.updatedBy ? ` · Updated by ${selected.updatedBy.fullName}` : ''}
                    </p>
                  ) : null}
                  <div className="form-actions">
                    <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={formSaving}>
                      Cancel
                    </Button>
                    {(selected ? canEdit : canCreate) ? (
                      <Button type="submit" loading={formSaving}>
                        Save
                      </Button>
                    ) : null}
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}

      {historyOpen && selected
        ? createPortal(
            <div className="modal-backdrop" onClick={closeHistory}>
              <div
                className="modal-panel md-history-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="md-history-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="md-history-header">
                  <div className="md-history-title">
                    <span className="md-history-title-icon" aria-hidden>
                      <HugeiconsIcon icon={HistoryIcon} size={18} color="currentColor" strokeWidth={1.8} />
                    </span>
                    <div>
                      <h3 id="md-history-title">History · {selected.name}</h3>
                      <p>Track the changes made to this record over time.</p>
                    </div>
                  </div>
                  <button type="button" className="modal-close" aria-label="Close" onClick={closeHistory}>
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
                {historyLoading ? (
                  <div className="md-history-loading">
                    <Spin />
                  </div>
                ) : history.length === 0 ? (
                  <p className="muted md-history-empty">No history yet.</p>
                ) : (
                  <div className="md-history-layout">
                    <aside className="md-history-timeline" aria-label="Timeline">
                      <h4>Timeline</h4>
                      <ol>
                        {history.map((entry) => {
                          const parsed = parseHistoryMetadata(entry.metadata)
                          const kind = historyKind(entry.action, parsed.changes)
                          const active = entry.id === historyEntryId
                          return (
                            <li key={entry.id}>
                              <button
                                type="button"
                                className={`md-history-event is-${kind}${active ? ' is-active' : ''}`}
                                onClick={() => setHistoryEntryId(entry.id)}
                              >
                                <span className="md-history-dot" aria-hidden>
                                  <HugeiconsIcon icon={historyKindIcon(kind)} size={12} color="currentColor" strokeWidth={2} />
                                </span>
                                <span className="md-history-event-copy">
                                  <strong>{historyTitle(kind)}</strong>
                                  <time dateTime={new Date(entry.createdAt).toISOString()}>
                                    {formatHistoryDate(entry.createdAt)}
                                  </time>
                                  <span className="md-history-event-user">
                                    <HugeiconsIcon icon={UserIcon} size={12} color="currentColor" strokeWidth={1.8} />
                                    {entry.user?.fullName || 'System'}
                                    <em>{entry.user?.role || (entry.user ? 'User' : 'System')}</em>
                                  </span>
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ol>
                    </aside>
                    {(() => {
                      const active = history.find((entry) => entry.id === historyEntryId) || history[0]
                      const parsed = parseHistoryMetadata(active.metadata)
                      const kind = historyKind(active.action, parsed.changes)
                      const rows = historyChangeRows(active.action, active.metadata)
                      const isLatest = active.id === history[0]?.id
                      const roleLabel = active.user?.role || (active.user ? 'User' : 'System')
                      return (
                        <div className="md-history-detail">
                          <div className="md-history-detail-head">
                            <div className="md-history-detail-title">
                              <span className={`md-history-detail-icon is-${kind}`} aria-hidden>
                                <HugeiconsIcon icon={historyKindIcon(kind)} size={16} color="currentColor" strokeWidth={1.8} />
                              </span>
                              <div>
                                <strong>{historyTitle(kind)}</strong>
                                <p>
                                  <time dateTime={new Date(active.createdAt).toISOString()}>
                                    {formatHistoryDate(active.createdAt)}
                                  </time>
                                  <span>
                                    <HugeiconsIcon icon={UserIcon} size={13} color="currentColor" strokeWidth={1.8} />
                                    {active.user?.fullName || 'System'}
                                    <em className={`md-history-role is-${roleLabel.toLowerCase().replace(/\s+/g, '-')}`}>
                                      {roleLabel}
                                    </em>
                                  </span>
                                </p>
                              </div>
                            </div>
                            {isLatest ? <span className="md-history-latest">Latest</span> : null}
                          </div>
                          <HistoryFieldList title="Changes Made" rows={rows} valueKey="to" />
                          {kind === 'created' ? null : (
                            <HistoryFieldList title="Previous Value" rows={rows} valueKey="from" />
                          )}
                          <section className="md-history-card md-history-notes">
                            <h4>
                              <HugeiconsIcon icon={Note01Icon} size={16} color="currentColor" strokeWidth={1.6} />
                              Additional Information
                            </h4>
                            <p>{parsed.notes || 'No additional notes for this change.'}</p>
                          </section>
                        </div>
                      )
                    })()}
                  </div>
                )}
                <div className="md-history-footer">
                  <Button type="button" variant="secondary" onClick={closeHistory}>
                    Close
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {deleteTarget
        ? createPortal(
            <div
              className="modal-backdrop"
              onClick={() => {
                if (!deleteSaving) {
                  setDeleteTarget(null)
                }
              }}
            >
              <div
                className="modal-panel status-confirm-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="md-delete-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <h3 id="md-delete-title">Delete {entityName}?</h3>
                  <button
                    type="button"
                    className="modal-close"
                    aria-label="Close"
                    disabled={deleteSaving}
                    onClick={() => setDeleteTarget(null)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
                <p className="status-confirm-copy">
                  Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be
                  undone.
                </p>
                <div className="form-actions">
                  <Button loading={deleteSaving} className="ui-btn-danger" onClick={() => void confirmDelete()}>
                    Delete
                  </Button>
                  <Button type="button" variant="secondary" disabled={deleteSaving} onClick={() => setDeleteTarget(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {importOpen && importResult
        ? createPortal(
            <div className="modal-backdrop" onClick={() => setImportOpen(false)}>
              <div className="modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h3>Import result</h3>
                  <button type="button" className="modal-close" aria-label="Close" onClick={() => setImportOpen(false)}>
                    <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
                <p>
                  Total {importResult.total}, Successful {importResult.successful}, Failed {importResult.failed}
                </p>
                {importResult.errors.length > 0 ? (
                  <ul className="md-import-errors">
                    {importResult.errors.slice(0, 8).map((item) => (
                      <li key={`${item.row}-${item.message}`}>
                        Row {item.row}: {item.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="form-actions">
                  {importResult.errors.length > 0 ? (
                    <Button variant="secondary" onClick={downloadErrors}>
                      Export errors
                    </Button>
                  ) : null}
                  <Button onClick={() => setImportOpen(false)}>Close</Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {toast
        ? createPortal(
            <div className={`app-toast app-toast-${toast.type}`} role="status">
              {toast.text}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
